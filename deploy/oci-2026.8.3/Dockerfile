ARG BASE_IMAGE=ghcr.io/goauthentik/server:2026.8.3
FROM ${BASE_IMAGE}
ARG FRONTEND_BUILD_ID
ARG FRONTEND_SOURCE_SHA256
ENV GIT_BUILD_HASH=${FRONTEND_BUILD_ID}
LABEL cc.kreeper.authentik.frontend-build=${FRONTEND_BUILD_ID} \
      cc.kreeper.authentik.frontend-source-sha256=${FRONTEND_SOURCE_SHA256}
# Keep the running release's backend and original hashed chunks for open tabs.
COPY --chown=1000:1000 dist/ /web/dist/
