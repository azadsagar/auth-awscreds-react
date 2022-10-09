resource "aws_cloudfront_origin_access_identity" "oci" {
  comment = "Serve UI Content via Cloudfront"
}

resource "aws_s3_bucket" "reactapp" {
  bucket = var.bucketname
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bucketsse" {
  bucket = aws_s3_bucket.reactapp.bucket

  rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
}

resource "aws_s3_bucket_acl" "bucket_acl" {
  bucket = aws_s3_bucket.reactapp.id
  acl    = "private"
}

resource "aws_s3_bucket_policy" "reactapp_policy" {
  bucket = aws_s3_bucket.reactapp.id
  policy = jsonencode({
    "Version": "2008-10-17",
    "Id": "PolicyForCloudFrontPrivateContent",
    "Statement": [
        {
            Sid: "1",
            Effect: "Allow",
            Principal: {
                AWS: "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.oci.id}"
            },
            Action: [
                "s3:GetObject"
            ],
            Resource: "arn:aws:s3:::${aws_s3_bucket.reactapp.id}/*"
        },
        {
            Sid: "AllowSSLRequestsOnly",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
                "arn:aws:s3:::${aws_s3_bucket.reactapp.id}",
                "arn:aws:s3:::${aws_s3_bucket.reactapp.id}/*"
            ],
            Condition: {
                Bool: {
                    "aws:SecureTransport": "false"
                }
            }
        }
    ]
  })
}

resource "aws_acm_certificate" "cert" {
  domain_name = var.app_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudfront_distribution" "cdn" {

  enabled = true
  is_ipv6_enabled = true


  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["HEAD","GET"]
    target_origin_id       = "authawscreds-react-app"
    viewer_protocol_policy = "redirect-to-https"
    compress = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

  }

  default_root_object = "index.html"

  aliases = [var.app_domain_name]


  origin {
    domain_name = aws_s3_bucket.reactapp.bucket_regional_domain_name
    origin_id   = "authawscreds-react-app"

    s3_origin_config {
      origin_access_identity = "origin-access-identity/cloudfront/${aws_cloudfront_origin_access_identity.oci.id}"
    }

  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
    acm_certificate_arn = aws_acm_certificate.cert.arn
  }

}

resource "time_sleep" "sleep" {
  depends_on = [aws_cloudfront_distribution.cdn,aws_acm_certificate.cert,aws_s3_bucket.reactapp]
  destroy_duration = "30s"
}

resource "null_resource" "deploy_app" {
  depends_on = [time_sleep.sleep]

  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = "npm install && npm run build && aws s3 sync ${path.module}/build/ s3://${aws_s3_bucket.reactapp.id}/ --delete"
    interpreter = ["bash","-c"]
  }
}