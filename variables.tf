variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "prefix" {
  description = "Name prefix for all resources"
  type        = string
  default     = "flights-demo-api"
}
