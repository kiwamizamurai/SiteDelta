FROM jacoblincool/playwright:chromium-light@sha256:846c0c7a9318ed7f686fb9abe2f99f2566f4c0c63e79700769eff2c5e257ee0f

ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

LABEL org.opencontainers.image.source="https://github.com/kiwamizamurai/sitedelta"
LABEL org.opencontainers.image.description="Website change monitoring for GitHub Actions"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsup.config.ts tsconfig.json ./
COPY src ./src
RUN npm run build

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
