FROM php:8.3-cli-bookworm

WORKDIR /var/www/html

# Install system dependencies, PostgreSQL dev libs, Python 3, venv, and OpenCV runtime libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    libpq-dev \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    libfreetype6-dev \
    libzip-dev \
    python3 \
    python3-venv \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) pdo pdo_pgsql pgsql gd exif zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

# Setup Python virtual environment for YOLO ONNX inference
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir onnxruntime opencv-python-headless numpy

# Copy Composer binary from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy composer definition and install dependencies
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts --no-autoloader --prefer-dist

# Copy remaining application source code
COPY . .

# Generate optimized autoloader and set permissions
RUN composer dump-autoload --optimize \
    && chmod -R 777 storage bootstrap/cache

EXPOSE 8000

CMD ["sh", "-c", "php artisan storage:link --force 2>/dev/null || true; php artisan migrate --force || true; php artisan serve --host=0.0.0.0 --port=8000"]
