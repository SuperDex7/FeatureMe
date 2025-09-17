#!/bin/bash

# Setup ECR repositories for FeatureMe
# Run this script once to create the ECR repositories

set -e

AWS_REGION="us-east-2"
AWS_ACCOUNT_ID="439964562220"

echo "Setting up ECR repositories..."

# Create ECR repositories
aws ecr create-repository --repository-name featureme-backend --region $AWS_REGION || echo "Backend repository already exists"
aws ecr create-repository --repository-name featureme-frontend --region $AWS_REGION || echo "Frontend repository already exists"

# Get repository URIs
BACKEND_URI=$(aws ecr describe-repositories --repository-names featureme-backend --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text)
FRONTEND_URI=$(aws ecr describe-repositories --repository-names featureme-frontend --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text)

echo "ECR Setup Complete!"
echo "Backend repository: $BACKEND_URI"
echo "Frontend repository: $FRONTEND_URI"
echo ""
echo "Next steps:"
echo "1. Configure GitHub secrets (see setup-github-secrets.md)"
echo "2. Push your code to trigger the deployment"
