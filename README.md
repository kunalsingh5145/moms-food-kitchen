# Mom's Food Kitchen

A starter full-stack tiffin ordering app:
- React + Vite frontend
- Node.js + Express + MongoDB backend
- Customer registration/login
- Weekly menu and daily tiffin availability
- Customer food customization and order tracking
- Admin menu/inventory management and order approval/rejection
- COD and manual UPI payment selection

## Requirements
- Node.js 18+
- MongoDB local installation or MongoDB Atlas connection

## 1. Backend setup
Open a terminal in `backend`:

```bash
npm install
```

Copy `.env.example` to `.env` and edit it:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/moms_food_kitchen
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
ADMIN_NAME=Kitchen Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisAdminPassword123!
UPI_ID=yourupi@bank
UPI_NAME=Moms Food Kitchen
```

Start the backend:

```bash
npm run dev
```

On first start, the server creates the admin account from the environment variables if it does not already exist.

## 2. Frontend setup
Open another terminal in `frontend`:

```bash
npm install
```

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open http://localhost:5173

## 3. First login
- Customer: use **Create account** on the website.
- Admin: use the email and password configured in `backend/.env`.

## Important payment note
The included UPI option is a manual UPI workflow: the app displays the configured UPI ID and lets the customer enter a UPI reference/UTR. It does **not** automatically verify payment or collect money. For automatic online payment verification, integrate a payment gateway such as Razorpay on the server before going live.

## Important production notes
This is a learning/starter project. Before public launch:
- Use a strong unique JWT secret and strong admin password.
- Configure HTTPS and secure deployment environment variables.
- Add rate limiting, email/phone verification, input validation and backups.
- Integrate and verify real payments server-side.
- Review delivery areas, privacy policy and refund/cancellation rules.
