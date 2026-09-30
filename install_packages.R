# Cài đặt các gói R cho máy phân tích Discrete Choice Modelling
options(repos = c(CRAN = "https://cloud.r-project.org"))

pkgs <- c(
  "plumber",
  "jsonlite",
  "data.table",
  "psych",
  "MASS",
  "lavaan",
  "semTools",
  "support.BWS",
  "apollo"
)

for (p in pkgs) {
  if (!requireNamespace(p, quietly = TRUE)) {
    cat(sprintf("Installing R package: %s\n", p))
    install.packages(p, dependencies = TRUE)
  }
}
cat("Toàn bộ các gói R cần thiết đã được cài đặt thành công!\n")
