# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

**CRITICAL**: This document contains the exact configuration needed for production deployment.

**Last Updated**: December 22, 2025
**Current Environment**: 🧪 SANDBOX/TEST MODE

---

## ⚠️ BEFORE DEPLOYING TO PRODUCTION

### 🔴 CRITICAL CHANGES REQUIRED

You **MUST** change these environment variables in `.env.local` (or your production environment variables):

---

## 📋 Environment Variables Configuration

### 🧪 TEST/SANDBOX Configuration (CURRENT)

```bash
# PagueloFacil Payment Gateway - SANDBOX MODE
PAGUELOFACIL_CCLW=B3B42F50E474663C6E508CA8DFA9869BC0FBA03E9E6650226DDFBCC38F55C4CF2C190251E1793674A96149D931DC08E5FBB33255D2D83654DF669538BE6B6B9B
PAGUELOFACIL_ENVIRONMENT=sandbox

# This uses:
# - Endpoint: https://sandbox.paguelofacil.com/LinkDeamon.cfm
# - Checkout: https://checkout-demo.paguelofacil.com
# - Test cards only (no real charges)
```

---

### 🟢 PRODUCTION Configuration (FOR DEPLOYMENT)

```bash
# PagueloFacil Payment Gateway - PRODUCTION MODE
PAGUELOFACIL_CCLW=B3B42F50E474663C6E508CA8DFA9869BC0FBA03E9E6650226DDFBCC38F55C4CF2C190251E1793674A96149D931DC08E5FBB33255D2D83654DF669538BE6B6B9B
PAGUELOFACIL_ENVIRONMENT=production

# This uses:
# - Endpoint: https://secure.paguelofacil.com/LinkDeamon.cfm
# - Checkout: https://checkout.paguelofacil.com
# - Real cards (REAL CHARGES - BE CAREFUL!)
```

---

## 🔄 How to Switch Environments

### Switch to Production (for deployment):

1. **Update `.env.local`** (or production environment):
   ```bash
   PAGUELOFACIL_ENVIRONMENT=production
   ```

2. **Verify the CCLW** is correct:
   ```bash
   # Should be ZERO's production CCLW:
   PAGUELOFACIL_CCLW=B3B42F50E474663C6E508CA8DFA9869BC0FBA03E9E6650226DDFBCC38F55C4CF2C190251E1793674A96149D931DC08E5FBB33255D2D83654DF669538BE6B6B9B
   ```

3. **Restart the server**:
   ```bash
   npm run build
   npm start
   ```

4. **Test with a small amount** (e.g., $1.00) to verify production endpoint works

---

### Switch Back to Sandbox (for testing):

1. **Update `.env.local`**:
   ```bash
   PAGUELOFACIL_ENVIRONMENT=sandbox
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Test Cards (Sandbox Only)

**VISA:**
- 4059310181757001
- 4916012776136988
- 4716040174085053

**MasterCard:**
- 5517747952039692
- 5451819737278230
- 5161216979741515

**CLAVE:**
- 6394240621480747 (CVV: 570, PIN: 0482)
- 5890846081457820 (CVV: 867, PIN: 2944)

**These will NOT work in production!**

---

## 📊 Current vs Production Comparison

| Setting | Current (Sandbox) | Production |
|---------|------------------|------------|
| **CCLW** | B3B42F50... | B3B42F50... (same) |
| **Environment** | `sandbox` | `production` |
| **Endpoint** | https://sandbox.paguelofacil.com/LinkDeamon.cfm | https://secure.paguelofacil.com/LinkDeamon.cfm |
| **Checkout URL** | https://checkout-demo.paguelofacil.com | https://checkout.paguelofacil.com |
| **Charges** | Fake (test only) | **REAL MONEY** |

---

## ✅ Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] Updated `PAGUELOFACIL_ENVIRONMENT=production` in production environment variables
- [ ] Verified CCLW is correct for production
- [ ] Tested with $1.00 test transaction in production
- [ ] Updated `NEXT_PUBLIC_APP_URL` to production domain (not Codespaces URL)
- [ ] Verified return URL callback works in production
- [ ] Checked server logs for any errors
- [ ] Confirmed order creation works end-to-end
- [ ] Tested payment success flow
- [ ] Tested payment failure flow (use declined test card first in sandbox)

---

## 🔐 Security Notes

1. **Never commit `.env.local` to git** - Already in `.gitignore`
2. **Use environment variables in Railway/Vercel** - Don't hardcode
3. **Keep CCLW secret** - It's your merchant authentication key
4. **Monitor production transactions** - Check PagueloFacil dashboard daily
5. **Test in sandbox first** - Always test changes in sandbox before production

---

## 🆘 Rollback Plan

If production payment fails:

1. **Check environment variable**:
   ```bash
   echo $PAGUELOFACIL_ENVIRONMENT
   ```
   Should be `production`, not `sandbox`

2. **Check endpoint in logs**:
   Look for: `[PagueloFacil] Using endpoint: https://secure.paguelofacil.com/LinkDeamon.cfm`

3. **Test with cURL** (optional):
   ```bash
   curl -X POST 'https://secure.paguelofacil.com/LinkDeamon.cfm' \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d 'CCLW=B3B42F50E474663C6E508CA8DFA9869BC0FBA03E9E6650226DDFBCC38F55C4CF2C190251E1793674A96149D931DC08E5FBB33255D2D83654DF669538BE6B6B9B' \
     -d 'CMTN=1.00' \
     -d 'CDSC=Test Order' \
     -d 'RETURN_URL=https://yourdomain.com/api/checkout/payment-callback' \
     -d 'PARM_1=TEST-001' \
     -d 'EXPIRES_IN=3600'
   ```

4. **Contact PagueloFacil Support**:
   - Email: soporte@paguelofacil.com
   - Dashboard: https://panel.paguelofacil.com

---

## 📚 Related Documentation

- **Integration Plan**: `/docs/progress/FINISHED-PAGUELOFACIL-PAYMENT-INTEGRATION-PLAN.md`
- **Debugging History**: `/docs/progress/FINISHED-DEBUGGING-PAGUELOFACIL.md`
- **API Documentation**: `/docs/PAGUELOFACIL-DOCS.md`

---

## 🎯 Quick Reference

**To deploy to production:**
1. Change `PAGUELOFACIL_ENVIRONMENT=production` in production environment
2. Verify CCLW is correct
3. Deploy and test with $1 transaction
4. Monitor for errors

**To test in sandbox:**
1. Keep `PAGUELOFACIL_ENVIRONMENT=sandbox` in `.env.local`
2. Use test cards
3. Check checkout-demo.paguelofacil.com works

---

**IMPORTANT**: The only difference between sandbox and production is the `PAGUELOFACIL_ENVIRONMENT` variable. Everything else stays the same (CCLW, code, etc.).

---

**End of Production Deployment Checklist**
