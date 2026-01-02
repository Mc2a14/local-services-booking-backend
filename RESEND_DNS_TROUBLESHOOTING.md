# Resend DNS Verification Troubleshooting

## Current Status
- ✅ DNS records correctly configured in Namecheap
- ✅ External DNS checkers show green (propagated in USA and South America)
- ❌ Resend still showing "Pending" status

## Common Issues & Solutions

### 1. Namecheap Auto-Appending Domain
**Problem**: Namecheap may automatically append your domain to host values.

**Example**:
- You enter: `send.atencio.app`
- Namecheap creates: `send.atencio.app.atencio.app` ❌

**Solution**: 
- For root domain records, use `@` or leave blank
- For subdomain records, enter ONLY the subdomain part (e.g., `send`, not `send.atencio.app`)

### 2. DNS Record Format

#### SPF Record (TXT)
- **Host**: `@` (or blank for root domain)
- **Value**: `v=spf1 include:amazonses.com ~all`
- **Important**: Single spaces only, no double spaces

#### DKIM Records (TXT)
- **Host**: `resend._domainkey` (or `resend._domainkey.atencio.app` if Namecheap requires full)
- **Value**: Copy the EXACT long string from Resend dashboard
- **Important**: No line breaks, copy entire string

#### MX Record (Optional but recommended)
- **Host**: `@` (or blank)
- **Value**: `feedback-smtp.resend.com`
- **Priority**: `10`

### 3. Verification Steps

1. **Use Resend's DNS Checker**: https://dns.email
   - Enter domain: `atencio.app`
   - Check what Resend sees

2. **Restart Verification in Resend Dashboard**:
   - Go to Domains section
   - Find `atencio.app`
   - Click "Restart verification" or "Re-verify"

3. **Wait Time**: DNS can take up to 72 hours globally

### 4. Contact Resend Support

If still pending after 24-48 hours:
- **Email**: support@resend.com
- **Include**:
  - Domain: `atencio.app`
  - Screenshots of Namecheap DNS records
  - Confirmation that external DNS checkers show green

## Quick Verification Checklist

- [ ] SPF record: `v=spf1 include:amazonses.com ~all` (single spaces)
- [ ] DKIM records: All required TXT records added with exact values
- [ ] MX record: `feedback-smtp.resend.com` with priority 10
- [ ] Host values: No duplicate domain appending
- [ ] DNS propagation: Checked with multiple tools
- [ ] Resend DNS checker: Used https://dns.email
- [ ] Verification restarted: Clicked "Restart verification" in Resend


