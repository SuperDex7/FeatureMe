# GitHub Secrets Setup

Configure these secrets in your GitHub repository:

## Required Secrets

Go to: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### EC2 Connection
- `EC2_HOST`: Your EC2 public IP (e.g., `18.216.129.114`)
- `EC2_SSH_KEY`: Your private key content (paste the entire .pem file content)

### Application Secrets
- `MONGODB_URI`: Your MongoDB connection string
- `STRIPE_API_KEY`: Your Stripe API key
- `AWS_REGION`: `us-east-2`

## How to get AWS credentials:

1. **Create IAM user** (if you don't have one):
   - Go to IAM Console → Users → Create user
   - Attach policies: `AmazonEC2FullAccess`, `AmazonECRFullAccess`, `AmazonSSMFullAccess`

2. **Create access keys**:
   - Go to IAM Console → Users → Select your user → Security credentials
   - Create access key → Command Line Interface (CLI)
   - Download the credentials

## How to get EC2 SSH key:

1. **Generate new key pair** (recommended):
   - Go to EC2 Console → Key Pairs → Create key pair
   - Download the .pem file
   - Copy the entire content for the `EC2_SSH_KEY` secret

2. **Or use existing key**:
   - Copy the content of your existing `DexPc-ohio.pem` file

## Security Notes:
- Never commit these secrets to your repository
- Use least-privilege IAM policies in production
- Rotate access keys regularly
