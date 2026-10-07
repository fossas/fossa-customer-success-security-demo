# Intentionally old, end-of-life base image (Node 14 on an old Alpine) so
# `fossa container analyze` has OS-level vulnerabilities to report.
# Quick fix (Lab 10): change this line to `FROM node:22-alpine`.
FROM node:14.17.0-alpine

WORKDIR /app
COPY package.json package-lock.json ./
# Node 14 ships npm 6, which can't read this lockfile (v3); npm 8 can and still supports Node 14.
RUN npm install -g npm@8.19.4 && npm ci --omit=dev
COPY src ./src
COPY views ./views

ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
