class ApiResponse {
  constructor(statusCode, data, message = "success", success) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = success;
  }
}
export { ApiResponse }