const prisma = require('../config/prisma');

class InstallationService {
    /**
     * Create an installation assignment for an approved lead
     */
    async assignTeam(leadId, srTechnicianId, supportStaffId) {
        // 1. Verify lead is approved
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead || lead.status !== 'APPROVED') {
            throw new Error('Lead must be APPROVED before assigning an installation team.');
        }

        // 2. Create the assignment
        const assignment = await prisma.installationAssignment.create({
            data: {
                leadId,
                srTechnicianId,
                supportStaffId,
                status: 'PENDING'
            },
            include: {
                srTechnician: { select: { name: true } },
                supportStaff: { select: { name: true } }
            }
        });

        // 3. Update Lead Status
        await prisma.lead.update({
            where: { id: leadId },
            data: { status: 'TEAM_ASSIGNED' }
        });

        return assignment;
    }

    /**
     * Update the status of an installation
     */
    async updateStatus(assignmentId, newStatus) {
        const assignment = await prisma.installationAssignment.update({
            where: { id: assignmentId },
            data: { status: newStatus }
        });

        if (newStatus === 'IN_PROGRESS') {
            await prisma.lead.update({
                where: { id: assignment.leadId },
                data: { status: 'INSTALLATION_IN_PROGRESS' }
            });
        } else if (newStatus === 'COMPLETED') {
            await prisma.lead.update({
                where: { id: assignment.leadId },
                data: { status: 'COMPLETED' }
            });
        }

        return assignment;
    }

    /**
     * Get all installation assignments
     */
    async getAssignments() {
        return await prisma.installationAssignment.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                lead: { select: { customerName: true, address: true, phone: true } },
                srTechnician: { select: { name: true } },
                supportStaff: { select: { name: true } }
            }
        });
    }
}

module.exports = new InstallationService();
