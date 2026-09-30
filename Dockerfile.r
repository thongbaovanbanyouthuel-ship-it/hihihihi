FROM rocker/r-ver:4.3.2

# Cài đặt các thư viện hệ thống cần thiết cho Apollo, Rcpp, Plumber, XML, SSL
RUN apt-get update -qq && apt-get install --no-install-recommends -y \
    libssl-dev \
    libcurl4-openssl-dev \
    libxml2-dev \
    libsodium-dev \
    build-essential \
    gfortran \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY install_packages.R /app/
RUN Rscript install_packages.R

COPY analysis /app/analysis
COPY data /app/data

EXPOSE 8000

CMD ["Rscript", "analysis/run_server.R"]
