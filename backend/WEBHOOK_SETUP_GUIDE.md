# Razorpay Webhook Setup Guide 🚀

This guide will help you set up Razorpay webhooks for your PlaySplit application to automatically handle payment notifications.

## Prerequisites ✅

1. **Razorpay Account**: Make sure you have a Razorpay account (Test/Live)
2. **API Keys**: Have your Razorpay API Key ID and Key Secret
3. **Deployed Backend**: Your backend should be accessible via a public URL (localhost won't work for webhooks)

## Step 1: Environment Configuration 🔧

Make sure your `.env` file has the following variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Other required variables
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:3000
```

## Step 2: Generate Webhook Secret 🔐

You can generate a secure webhook secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use any strong random string generator. Update your `.env` file with this secret.

## Step 3: Deploy Your Backend 🌐

Deploy your backend to a platform like:
- **Heroku**: `https://your-app.herokuapp.com`
- **Railway**: `https://your-app.up.railway.app`  
- **Render**: `https://your-app.onrender.com`
- **DigitalOcean App Platform**: `https://your-app-xxxxx.ondigitalocean.app`
- **AWS/GCP/Azure**: Your custom domain

Your webhook endpoint will be: `https://your-domain.com/api/payments/webhook`

## Step 4: Test Webhook Endpoint 🧪

Before configuring in Razorpay, test that your webhook endpoint is accessible:

1. **Via Browser**: Visit `https://your-domain.com/api/payments/webhook/test`
2. **Via cURL**:
   ```bash
   curl https://your-domain.com/api/payments/webhook/test
   ```

You should see a JSON response confirming the endpoint is working.

## Step 5: Configure Webhook in Razorpay Dashboard ⚙️

### For Test Mode:
1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Click **+ Create New Webhook**
4. Fill in the details:
   - **Webhook URL**: `https://your-domain.com/api/payments/webhook`
   - **Secret**: The webhook secret from your `.env` file
   - **Alert Email**: Your email address (optional)

### Select Events to Monitor:
Check the following events (these are handled by your application):

#### ✅ **Payment Events** (Essential)
- `payment.captured` - When payment is successfully captured
- `payment.failed` - When payment fails

#### ✅ **Order Events** (Recommended)  
- `order.paid` - When an order is marked as paid

#### ✅ **Refund Events** (If using refunds)
- `refund.created` - When refund is initiated
- `refund.processed` - When refund is processed

### Additional Events (Optional):
- `payment.authorized` - Payment authorized but not captured
- `payment.dispute.created` - Dispute raised on payment
- `settlement.processed` - Settlement processed

## Step 6: Test Webhook Integration 🔍

### Method 1: Using Razorpay Test Mode
1. Create a test payment using your application
2. Complete the payment flow
3. Check your server logs for webhook notifications
4. Verify payment status is updated in your database

### Method 2: Manual Testing with cURL
```bash
curl -X POST https://your-domain.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test_signature" \
  -d '{
    "event": "payment.captured",
    "account_id": "acc_test",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "amount": 50000,
          "status": "captured",
          "method": "upi"
        }
      }
    }
  }'
```

## Step 7: Monitor Webhook Logs 📊

Your application logs webhook events with emojis for easy identification:

- 🔔 **Webhook received**: Initial webhook processing
- 💰 **Payment captured**: Successful payment processing  
- ❌ **Payment failed**: Failed payment processing
- ↩️ **Refund processed**: Refund event handling
- ✅ **Webhook processed successfully**: Successful completion
- ⚠️ **Warnings**: Issues found during processing

### Log Examples:
```
🔔 Razorpay Webhook received: { event: 'payment.captured', timestamp: '2024-01-15T10:30:00Z' }
💰 Processing payment.captured webhook: pay_test123
✅ Payment captured and updated: { paymentId: 'pay_test123', matchId: 'match_456', amount: 500 }
✅ Webhook processed successfully: payment.captured
```

## Step 8: Handle Production Deployment 🚀

### For Live Mode:
1. Switch to **Live Mode** in Razorpay Dashboard
2. Create a new webhook with your **production URL**
3. Use your **Live API Keys** in production environment
4. Update webhook secret in production `.env`

### Security Best Practices:
- ✅ Always verify webhook signatures
- ✅ Use HTTPS for webhook URLs
- ✅ Keep webhook secrets secure
- ✅ Log webhook events for monitoring
- ✅ Implement idempotency for webhook processing
- ✅ Set up proper error monitoring

## Troubleshooting 🔧

### Common Issues:

#### 1. **Webhook URL Not Accessible**
- **Error**: Razorpay shows "URL not reachable"
- **Solution**: Ensure your backend is deployed and accessible publicly

#### 2. **Invalid Signature Error**
- **Error**: "Invalid webhook signature"  
- **Solution**: Check that `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay dashboard

#### 3. **Webhook Not Triggering**
- **Solution**: 
  - Check webhook is active in Razorpay dashboard
  - Verify selected events include the ones you need
  - Test with webhook/test endpoint first

#### 4. **Payment Not Getting Updated**
- **Solution**:
  - Check database connection
  - Verify payment record exists in database
  - Check server logs for errors

#### 5. **CORS Issues**
- **Solution**: Webhooks are server-to-server calls, CORS doesn't apply

### Debug Commands:

#### Check webhook endpoint:
```bash
curl https://your-domain.com/api/payments/webhook/test
```

#### Check server health:
```bash  
curl https://your-domain.com/health
```

#### View webhook logs:
```bash
# If using PM2
pm2 logs your-app-name

# If using Docker
docker logs container-name

# If using Heroku
heroku logs --tail -a your-app-name
```

## Environment-Specific Configuration 🌍

### Development:
```env
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_your_test_key
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
```

### Production:
```env
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_live_your_live_key
RAZORPAY_KEY_SECRET=your_live_secret  
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
```

## Support 💬

If you encounter issues:

1. **Check Logs**: Always check your server logs first
2. **Test Endpoint**: Use `/webhook/test` endpoint to verify accessibility
3. **Razorpay Dashboard**: Check webhook delivery status in Razorpay
4. **Documentation**: Refer to [Razorpay Webhook Documentation](https://razorpay.com/docs/webhooks/)

## Summary ✨

Once set up correctly, webhooks will:

- ✅ Automatically update payment status in real-time
- ✅ Send real-time notifications to users via Socket.IO
- ✅ Handle payment failures and refunds
- ✅ Maintain data consistency between Razorpay and your application
- ✅ Provide comprehensive logging for debugging

Your webhook is now ready to handle Razorpay payment events automatically! 🎉
