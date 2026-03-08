# Invessiv Website

## Google Search Console Setup

1. Open Google Search Console and create a **Domain property** for `invessiv.com`.
2. In IONOS DNS, add the TXT verification record provided by Google.
3. Wait for DNS propagation and verify the property in Search Console.
4. Submit `https://www.invessiv.com/sitemap.xml` in Search Console.
5. Keep `GOOGLE_SITE_VERIFICATION` (or `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`) set in Vercel only if URL-prefix verification is used.
