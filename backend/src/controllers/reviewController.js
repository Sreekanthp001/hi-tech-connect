const prisma = require('../config/prisma');

// 1. Submit a review (Public Route)
exports.submitReview = async (req, res) => {
    try {
        const { ticketId, rating, comment } = req.body;

        if (!ticketId || !rating) {
            return res.status(400).json({ error: "Ticket ID and rating are required" });
        }

        const ratingInt = parseInt(rating);
        if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { review: true }
        });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        if (ticket.status !== 'COMPLETED') {
            return res.status(400).json({ error: "Reviews can only be submitted for completed tickets" });
        }

        if (ticket.review) {
            return res.status(400).json({ error: "A review has already been submitted for this ticket" });
        }

        const review = await prisma.review.create({
            data: {
                ticketId,
                rating: ratingInt,
                comment
            }
        });

        res.status(201).json(review);
    } catch (error) {
        console.error("Submit review error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 2. Get all reviews (Admin only)
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                ticket: {
                    select: {
                        clientName: true,
                        type: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Get all reviews error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 3. Get direct ticket info for review page (Public)
exports.getReviewTicketInfo = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
                id: true,
                clientName: true,
                type: true,
                status: true,
                title: true,
                review: true
            }
        });

        if (!ticket) return res.status(404).json({ error: "Ticket not found" });
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
