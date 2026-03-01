const prisma = require('../config/prisma');

class LeadService {
    /**
     * Create a new lead
     */
    async createLead(data) {
        return await prisma.lead.create({
            data: {
                customerName: data.customerName,
                phone: data.phone,
                address: data.address,
                requirementSummary: data.requirementSummary,
                status: 'NEW_LEAD'
            }
        });
    }

    /**
     * Assign a technician for a site visit
     */
    async assignSiteVisit(leadId, technicianId, visitDate) {
        return await prisma.lead.update({
            where: { id: leadId },
            data: {
                assignedTechnicianId: technicianId,
                siteVisitDate: visitDate,
                status: 'SITE_VISIT_PENDING'
            }
        });
    }

    /**
     * Add site visit notes and update status
     */
    async completeSiteVisit(leadId, notes) {
        return await prisma.lead.update({
            where: { id: leadId },
            data: {
                lastFollowUpNote: notes,
                status: 'SITE_VISITED'
            }
        });
    }

    /**
     * Get all leads grouped by status for the Dashboard
     */
    async getGroupedLeads() {
        const leads = await prisma.lead.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                assignedTechnician: { select: { name: true } }
            }
        });

        const grouped = {};
        leads.forEach(lead => {
            if (!grouped[lead.status]) {
                grouped[lead.status] = [];
            }
            grouped[lead.status].push(lead);
        });

        return grouped;
    }

    /**
     * Get leads requiring follow-up
     */
    async getFollowUpRequired() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await prisma.lead.findMany({
            where: {
                OR: [
                    { status: 'FOLLOW_UP_PENDING' },
                    {
                        AND: [
                            { status: 'QUOTATION_SENT' },
                            { nextFollowUpDate: { lte: today } }
                        ]
                    }
                ]
            },
            orderBy: { nextFollowUpDate: 'asc' },
            include: {
                quotations: {
                    select: { quotationNo: true, grandTotal: true }
                }
            }
        });
    }

    /**
     * Log a follow-up action
     */
    async logFollowUp(leadId, note, nextDate) {
        return await prisma.lead.update({
            where: { id: leadId },
            data: {
                lastFollowUpNote: note,
                nextFollowUpDate: nextDate,
                followUpCount: { increment: 1 },
                status: 'FOLLOW_UP_PENDING'
            }
        });
    }

    /**
     * Update lead status (e.g., to APPROVED or CANCELLED)
     */
    async updateStatus(leadId, status) {
        return await prisma.lead.update({
            where: { id: leadId },
            data: { status }
        });
    }
}

module.exports = new LeadService();
