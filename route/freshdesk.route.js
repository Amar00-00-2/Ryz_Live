const express = require("express");
const router = express.Router();
const {freshDeskController} = require('../controller');

router
    .route('/tickets')
    .get(freshDeskController.Tickets)

router
    .route('/ticket/:id')
    .get(freshDeskController.getTicket)

router
    .route('/ticket')
    .post(freshDeskController.createTicket)

router
    .route('/tickets/:cf_client_code')
    .get(freshDeskController.TicketsByUserId)

router
    .route('/ticket/:id')
    .put(freshDeskController.UpdateTicketById)

router
    .route('/ticket-status')
    .get(freshDeskController.TicketStatus)

router
    .route('/ticket-priority')
    .get(freshDeskController.TicketPriority)

router
    .route('/update-bulk-tickets')
    .post(freshDeskController.UpdateBulkOfTickets)

router
    .route('/ticket/:id')
    .delete(freshDeskController.DeleteTicketById)

router
    .route('/delete-bulk-tickets')
    .post(freshDeskController.DeleteBulkofTickets)

router
    .route('/agents/:id')
    .post(freshDeskController.getAgentById)

router
    .route('/categories')
    .get(freshDeskController.Categories)

router
    .route('/folders/:category_id')
    .get(freshDeskController.FoldersByCategoryId)

router
    .route('/articles/:folder_id')
    .get(freshDeskController.ArticlesByFolderId)

router
    .route('/article/:article_id')
    .get(freshDeskController.getArticleById)
    
module.exports = router;