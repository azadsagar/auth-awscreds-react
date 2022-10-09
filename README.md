# UI App for auth-awscreds

This is the fronend app written in ReactJS for [aws-authcreds](https://github.com/azadsagar/auth-awscreds) project.

## How to Deploy this application

### Prequisite:

- Assuming your aws cli is in working state.
- your aws profile has appropriate permission
- if you are running this right from ec2 machine, make sure your IAM role has appropriate policy attached
- NodeJS 14+ is installed

### Setup Environment Variables

Create `.env` file in current directory.

Add below environment variables and set appropriate values.

- REACT_APP_IDENTITY_POOL_ID
- REACT_APP_COGNITO_REGION
- REACT_APP_COGNITO_USER_POOL_ID
- REACT_APP_COGNTIO_DOMAIN_NAME
- REACT_APP_DOMAIN_NAME
- REACT_APP_CLIENT_ID
- REACT_APP_CLI_APP_URL
- REACT_APP_API_APP_URL

### Update `vars.tf` file
Before running the terraform script, update the defaults value in vars.tf file. 
Minimum configuration required is `aws_region`, `bucketname` and `app_domain_name`

### Create Infrastructure, Build and Deploy
Run the commands in below order
- `terraform plan -out plan` : this creates a plan for your infrastructure and stores in `plan` file
- `terraform apply plan` : applies the plan.

At first the plan *may not be applied* successfully.

ACM Certificate needs a DNS validation. Once the ACM certificate is generated you will need to create CNAMe record with your DNS provider.
Once your ACM certificate is validate, your can re-run above commands.


Terraform has null resources module cordinated with local exec which takes care of building and deploying react app to s3 bucket.