## Newsletter Subscription Service

_Created by [Sanel Ryan](https://github.com/SanelRyan) @ [Gladiator Games](https://gladiatorgames.xyz)_

This is a Node.js application for managing newsletter subscriptions and unsubscribes. It utilizes Express.js for handling HTTP requests, MongoDB for data storage, Nodemailer for sending emails, and Express Rate Limit for limiting the number of requests.

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/Gladiator-Games/newsletterapi.git
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables by creating a `.env` file in the root directory and adding the following variables:

    ```
    EMAIL_HOST=your_email_host
    EMAIL_PORT=your_email_port
    EMAIL_USER=your_email_user
    EMAIL_PASS=your_email_password
    URI=your_mongodb_uri
    FROM_EMAIL=your_from_email_address
    PORT=desired_port_number
    COMPANY_NAME=your_company_name
    ```

### Usage

Start the server:

```bash
npm start
```

### Endpoints

-   `POST /subscribe`: Allows users to subscribe to the newsletter.

    -   Request body: `{ "email": "user@example.com" }`
    -   Response:
        -   Success: `{ "success": true, "message": "Subscribed successfully", "email": "unsubscribe_url" }`
        -   Failure: `{ "success": false, "message": "Error message" }`

-   `GET /unsubscribe`: Allows users to unsubscribe from the newsletter.
    -   Query parameter: `email=user@example.com`
    -   Response:
        -   Success: Returns the unsubscribe confirmation page.
        -   Failure: `{ "success": false, "message": "Error message" }`

### Rate Limiting

Requests to the `/subscribe` endpoint are limited to 5 requests per 24 hours.

### Email Templates

-   Subscription confirmation email: `subscribe.html`
-   Unsubscribe confirmation email: `unsubscribe.html`

### Dependencies

-   `express`: Fast, unopinionated, minimalist web framework for Node.js.
-   `mongodb`: The official MongoDB driver for Node.js.
-   `nodemailer`: Module for sending emails.
-   `express-rate-limit`: Basic rate-limiting middleware for Express.

### Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
