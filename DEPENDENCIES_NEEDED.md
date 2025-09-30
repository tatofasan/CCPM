# Additional Dependencies Required

The following npm packages need to be installed for the Product CRUD functionality to work completely:

## AWS SDK for S3 Image Uploads

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

These packages are required for:
- Generating pre-signed S3 URLs for image uploads
- Managing product images in S3 bucket
- File deletion from S3

## Environment Variables

After installing AWS SDK, add these to your `.env` file:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=your_bucket_name
```

## Alternative: Use Without S3

If you don't want to use S3 for now, you can:
1. Comment out the `/app/api/admin/products/upload-url/route.ts` endpoint
2. Use direct image URLs in the `imagesUrls` field when creating products
3. Replace the S3 implementation later when ready

The core product CRUD functionality will work without S3 - it's only needed for the image upload endpoint.