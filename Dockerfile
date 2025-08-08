FROM node:18-bullseye

RUN apt-get -y update && \
    DEBIAN_FRONTEND=noninteractive apt-get -y install \
    curl \
    vim \
    git \
    make \
    libnss3 \
    libxshmfence1 \
    libglu1 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    chromium

WORKDIR /app

COPY . .

RUN npm run install:all

RUN yarn playwright install

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]