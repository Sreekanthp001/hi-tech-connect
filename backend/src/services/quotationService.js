const prisma = require('../config/prisma');

class QuotationService {
    /**
     * Generates a draft quotation based on user requirements
     */
    async generateDraft(data) {
        const {
            customerName,
            customerPhone,
            cameraCount,
            cameraType, // Dome/Bullet/IP
            estimatedWireLengthPerCamera,
            addHdd = true,
            notes
        } = data;

        const items = [];

        // 1. Find Cameras
        const cameraProduct = await prisma.productMaster.findFirst({
            where: {
                category: 'Camera',
                type: cameraType,
                isActive: true
            }
        });

        if (cameraProduct) {
            items.push({
                productId: cameraProduct.id,
                name: cameraProduct.name,
                quantity: cameraCount,
                unitPrice: cameraProduct.unitPrice,
                totalPrice: cameraCount * cameraProduct.unitPrice
            });
        }

        // 2. Auto-select DVR/NVR
        const isIpCamera = cameraType.toLowerCase().includes('ip');
        const controllerCategory = isIpCamera ? 'NVR' : 'DVR';

        let capacity = 4;
        if (cameraCount > 4) capacity = 8;
        if (cameraCount > 8) capacity = 16;
        if (cameraCount > 16) capacity = 32;

        const controller = await prisma.productMaster.findFirst({
            where: {
                category: controllerCategory,
                type: `${capacity}CH`,
                isActive: true
            }
        });

        if (controller) {
            items.push({
                productId: controller.id,
                name: controller.name,
                quantity: 1,
                unitPrice: controller.unitPrice,
                totalPrice: controller.unitPrice
            });
        }

        // 3. Power Supply
        const powerSupply = await prisma.productMaster.findFirst({
            where: {
                category: 'Power',
                type: capacity <= 4 ? '4CH' : '8CH', // Simplified logic
                isActive: true
            }
        });

        if (powerSupply) {
            items.push({
                productId: powerSupply.id,
                name: powerSupply.name,
                quantity: 1,
                unitPrice: powerSupply.unitPrice,
                totalPrice: powerSupply.unitPrice
            });
        }

        // 4. HDD if required
        if (addHdd) {
            const hdd = await prisma.productMaster.findFirst({
                where: {
                    category: 'Storage',
                    isActive: true
                }
            });
            if (hdd) {
                items.push({
                    productId: hdd.id,
                    name: hdd.name,
                    quantity: 1,
                    unitPrice: hdd.unitPrice,
                    totalPrice: hdd.unitPrice
                });
            }
        }

        // 5. Wire Calculation
        const totalWireMeters = cameraCount * estimatedWireLengthPerCamera;
        const wireProduct = await prisma.productMaster.findFirst({
            where: {
                category: 'Cable',
                unitType: 'meter',
                isActive: true
            }
        });

        if (wireProduct) {
            items.push({
                productId: wireProduct.id,
                name: wireProduct.name,
                quantity: Math.ceil(totalWireMeters),
                unitPrice: wireProduct.unitPrice,
                totalPrice: Math.ceil(totalWireMeters) * wireProduct.unitPrice
            });
        }

        // 6. Installation Charges
        const installation = await prisma.productMaster.findFirst({
            where: {
                category: 'Service',
                unitType: 'per_camera',
                isActive: true
            }
        });

        if (installation) {
            items.push({
                productId: installation.id,
                name: installation.name,
                quantity: cameraCount,
                unitPrice: installation.unitPrice,
                totalPrice: cameraCount * installation.unitPrice
            });
        }

        // Calculate Totals
        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const gstAmount = subtotal * 0.18;
        const grandTotal = subtotal + gstAmount;

        // Create Quotation Record
        const quotationNo = `QTN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const quotation = await prisma.quotation.create({
            data: {
                quotationNo,
                customerName,
                customerPhone,
                cameraCount,
                cameraType,
                wireLength: totalWireMeters,
                notes,
                subtotal,
                gstAmount,
                grandTotal,
                status: 'DRAFT',
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice
                    }))
                }
            },
            include: {
                items: true
            }
        });

        return quotation;
    }

    /**
     * Recalculates totals for an existing quotation
     */
    async recalculateQuotation(quotationId, discount = 0, discountType = 'FLAT') {
        const quotation = await prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { items: true }
        });

        if (!quotation) throw new Error('Quotation not found');

        const subtotal = quotation.items.reduce((sum, item) => sum + item.totalPrice, 0);

        let discountAmount = 0;
        if (discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * discount) / 100;
        } else {
            discountAmount = discount;
        }

        const subtotalAfterDiscount = subtotal - discountAmount;
        const gstAmount = subtotalAfterDiscount * 0.18;
        const grandTotal = subtotalAfterDiscount + gstAmount;

        return await prisma.quotation.update({
            where: { id: quotationId },
            data: {
                subtotal,
                discount: discountAmount,
                discountType,
                gstAmount,
                grandTotal
            },
            include: { items: true }
        });
    }
}

module.exports = new QuotationService();
