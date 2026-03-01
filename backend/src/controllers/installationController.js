const installationService = require('../services/installationService');

exports.assignTeam = async (req, res) => {
    try {
        const { leadId, srTechnicianId, supportStaffId } = req.body;
        const assignment = await installationService.assignTeam(leadId, srTechnicianId, supportStaffId);
        res.status(201).json(assignment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const assignment = await installationService.updateStatus(id, status);
        res.status(200).json(assignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAssignments = async (req, res) => {
    try {
        const assignments = await installationService.getAssignments();
        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
