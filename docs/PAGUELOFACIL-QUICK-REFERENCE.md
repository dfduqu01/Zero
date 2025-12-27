# PagueloFacil Payment Integration - Quick Reference

**Last Updated**: December 22, 2025

---

## 🎯 One-Line Summary

**To deploy to production: Change `PAGUELOFACIL_ENVIRONMENT=production` in your environment variables. That's it!**

---

## 📋 Current Status

- ✅ Payment integration COMPLETE and WORKING
- ✅ Sandbox tested successfully
- ✅ Production endpoint ready
- 🧪 Currently running in: **SANDBOX MODE**

---

## 🔧 Configuration

### ZERO's PagueloFacil Credentials

```bash
CCLW: B3B42F50E474663C6E508CA8DFA9869BC0FBA03E9E6650226DDFBCC38F55C4CF2C190251E1793674A96149D931DC08E5FBB33255D2D83654DF669538BE6B6B9B
```

**Note**: Same CCLW for both sandbox and production!

---

## 🌐 Endpoints

| Environment | Endpoint | Checkout URL |
|-------------|----------|--------------|
| **Sandbox** | `https://sandbox.paguelofacil.com/LinkDeamon.cfm` | `https://checkout-demo.paguelofacil.com` |
| **Production** | `https://secure.paguelofacil.com/LinkDeamon.cfm` | `https://checkout.paguelofacil.com` |

**How it switches**: Automatically based on `PAGUELOFACIL_ENVIRONMENT` variable (see `paguelofacil-client.ts:36-40`)

---

## 🚀 For Production Deployment

### Step 1: Update Environment Variable

In Railway/Vercel/your hosting platform:

```bash
PAGUELOFACIL_ENVIRONMENT=production  # Change from 'sandbox' to 'production'
```

### Step 2: Deploy

```bash
npm run build
npm start
```

### Step 3: Test with $1

- Make a $1 test purchase
- Verify it appears in PagueloFacil dashboard
- Confirm order created in your database

**That's it! No code changes needed.**

---

## 🧪 Test Cards (Sandbox Only)

**Quick Test Card**: 4059310181757001 (VISA)

More test cards in `/docs/PRODUCTION-DEPLOYMENT-CHECKLIST.md`

---

## 🔍 How to Check Current Environment

Look at server logs when payment link is created:

```
Sandbox: [PagueloFacil] Using endpoint: https://sandbox.paguelofacil.com/LinkDeamon.cfm
Production: [PagueloFacil] Using endpoint: https://secure.paguelofacil.com/LinkDeamon.cfm
```

---

## 📚 Full Documentation

- **Deployment Checklist**: `/docs/PRODUCTION-DEPLOYMENT-CHECKLIST.md` (COMPREHENSIVE)
- **Integration Plan**: `/docs/progress/FINISHED-PAGUELOFACIL-PAYMENT-INTEGRATION-PLAN.md`
- **Debugging History**: `/docs/progress/FINISHED-DEBUGGING-PAGUELOFACIL.md`
- **API Docs**: `/docs/PAGUELOFACIL-DOCS.md`

---

## ⚡ TL;DR

```bash
# For Production:
PAGUELOFACIL_ENVIRONMENT=production

# For Testing:
PAGUELOFACIL_ENVIRONMENT=sandbox
```

**Same CCLW for both. Code automatically switches endpoints. Done.**

---

**End of Quick Reference**
