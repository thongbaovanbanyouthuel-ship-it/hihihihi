library(plumber)

port <- as.numeric(Sys.getenv("PORT", "8000"))
cat(sprintf("Khởi chạy R Plumber API trên cổng %d...\n", port))

pr <- plumb("analysis/plumber_api.R")
pr$run(host = "0.0.0.0", port = port)
