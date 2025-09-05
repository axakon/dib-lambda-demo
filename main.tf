terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# Build the TypeScript lambdas with esbuild (using npm install to avoid needing a lockfile)
resource "null_resource" "build_lambdas" {
  triggers = {
    get_hash  = filesha256("${path.module}/lambda_get/src/index.ts")
    post_hash = filesha256("${path.module}/lambda_post/src/index.ts")
    pkg_hash  = filesha256("${path.module}/package.json")
    ts_hash   = filesha256("${path.module}/tsconfig.json")
  }

  provisioner "local-exec" {
    command     = "npm install && npm run build"
    working_dir = path.module
  }
}

# Package GET lambda from built JS
data "archive_file" "get_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_get/dist"
  output_path = "${path.module}/build/get.zip"
  depends_on  = [null_resource.build_lambdas]
}

# Package POST lambda from built JS
data "archive_file" "post_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_post/dist"
  output_path = "${path.module}/build/post.zip"
  depends_on  = [null_resource.build_lambdas]
}

resource "aws_lambda_function" "get_flights" {
  function_name    = "${var.prefix}-get-flights"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_zip.output_path
  source_code_hash = data.archive_file.get_zip.output_base64sha256
  memory_size      = 128
  timeout          = 5
  publish          = true
  environment {
    variables = {
      APP_NAME = "flights-api"
    }
  }
}

resource "aws_lambda_function" "post_booking" {
  function_name    = "${var.prefix}-post-booking"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.post_zip.output_path
  source_code_hash = data.archive_file.post_zip.output_base64sha256
  memory_size      = 128
  timeout          = 5
  publish          = true
  environment {
    variables = {
      APP_NAME = "flights-api"
    }
  }
}
