const leadService = require('../services/leadService');

exports.createLead = async (req, res) => {
    try {
        const lead = await leadService.createLead(req.body);
        res.status(201).json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.assignSiteVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const { technicianId, visitDate } = req.body;
        const lead = await leadService.assignSiteVisit(id, technicianId, new Date(visitDate));
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.completeSiteVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const lead = await leadService.completeSiteVisit(id, notes);
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGroupedLeads = async (req, res) => {
    try {
        const leads = await leadService.getGroupedLeads();
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFollowUpRequired = async (req, res) => {
    try {
        const leads = await leadService.getFollowUpRequired();
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.logFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, nextDate } = req.body;
        const lead = await leadService.logFollowUp(id, note, nextDate ? new Date(nextDate) : null);
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const lead = await leadService.updateStatus(id, status);
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
