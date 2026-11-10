#!/usr/bin/env bash
set -euo pipefail

# Uses the existing billed project. Does not add Firebase, link billing, create
# service-account keys, change the website project, or register a bot webhook.
STARS_SERVICE_PROJECT=fan-site-496610
STARS_DATA_PROJECT=gta-vi-fan-site
STARS_REGION=us-central1
STARS_SERVICE=leonida-stars
STARS_ACCOUNT=stars-payments
STARS_IDENTITY="${STARS_ACCOUNT}@${STARS_SERVICE_PROJECT}.iam.gserviceaccount.com"
STARS_BUILD_IDENTITY="stars-build@${STARS_SERVICE_PROJECT}.iam.gserviceaccount.com"
STARS_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

if ! command -v gcloud >/dev/null 2>&1; then
  echo 'Google Cloud CLI is required. Run this script from a checkout in Google Cloud Shell, or install gcloud locally.' >&2
  exit 1
fi

# Fail before IAM or deployment changes if the merchant credentials are missing.
gcloud secrets describe TELEGRAM_STARS_BOT_TOKEN --project "$STARS_SERVICE_PROJECT" >/dev/null
gcloud secrets describe TELEGRAM_STARS_WEBHOOK_SECRET --project "$STARS_SERVICE_PROJECT" >/dev/null
STARS_TOKEN_VERSION=$(gcloud secrets versions list TELEGRAM_STARS_BOT_TOKEN --project "$STARS_SERVICE_PROJECT" --filter='state=ENABLED' --sort-by='~createTime' --limit=1 --format='value(name)')
STARS_WEBHOOK_VERSION=$(gcloud secrets versions list TELEGRAM_STARS_WEBHOOK_SECRET --project "$STARS_SERVICE_PROJECT" --filter='state=ENABLED' --sort-by='~createTime' --limit=1 --format='value(name)')
STARS_TOKEN_VERSION=${STARS_TOKEN_VERSION##*/}
STARS_WEBHOOK_VERSION=${STARS_WEBHOOK_VERSION##*/}
if [[ ! "$STARS_TOKEN_VERSION" =~ ^[0-9]+$ || ! "$STARS_WEBHOOK_VERSION" =~ ^[0-9]+$ ]]; then
  echo 'Both Stars secrets need an enabled version before deployment.' >&2
  exit 1
fi

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  iam.googleapis.com secretmanager.googleapis.com identitytoolkit.googleapis.com firestore.googleapis.com \
  --project "$STARS_SERVICE_PROJECT"
if ! gcloud iam service-accounts describe "$STARS_IDENTITY" --project "$STARS_SERVICE_PROJECT" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$STARS_ACCOUNT" --display-name='Leonida Stars payment runtime' --project "$STARS_SERVICE_PROJECT"
fi
if ! gcloud iam service-accounts describe "$STARS_BUILD_IDENTITY" --project "$STARS_SERVICE_PROJECT" >/dev/null 2>&1; then
  gcloud iam service-accounts create stars-build --display-name='Leonida Stars source builder' --project "$STARS_SERVICE_PROJECT"
fi

# Runtime access is explicit: private Firestore records and revocation-aware
# authentication in the original project, and two secrets in the billed project.
# datastore.user grants database read/write access; it is not collection-scoped.
gcloud projects add-iam-policy-binding "$STARS_DATA_PROJECT" --member="serviceAccount:${STARS_IDENTITY}" --role=roles/datastore.user --condition=None
gcloud projects add-iam-policy-binding "$STARS_DATA_PROJECT" --member="serviceAccount:${STARS_IDENTITY}" --role=roles/firebaseauth.viewer --condition=None
for STARS_SECRET in TELEGRAM_STARS_BOT_TOKEN TELEGRAM_STARS_WEBHOOK_SECRET; do
  gcloud secrets add-iam-policy-binding "$STARS_SECRET" --project "$STARS_SERVICE_PROJECT" --member="serviceAccount:${STARS_IDENTITY}" --role=roles/secretmanager.secretAccessor --condition=None
done

gcloud projects add-iam-policy-binding "$STARS_SERVICE_PROJECT" --member="serviceAccount:${STARS_BUILD_IDENTITY}" --role=roles/run.builder --condition=None

cd "$STARS_ROOT"
npm run stars:cloud:package
gcloud run deploy "$STARS_SERVICE" --project "$STARS_SERVICE_PROJECT" --region "$STARS_REGION" \
  --source cloudrun/stars --allow-unauthenticated --service-account "$STARS_IDENTITY" \
  --build-service-account="projects/${STARS_SERVICE_PROJECT}/serviceAccounts/${STARS_BUILD_IDENTITY}" \
  --min-instances=0 --max-instances=2 --concurrency=40 --memory=256Mi --cpu=1 --timeout=30 \
  --set-env-vars="STARS_AUTH_PROJECT_ID=${STARS_DATA_PROJECT},STARS_DATA_PROJECT_ID=${STARS_DATA_PROJECT},TELEGRAM_STARS_ENABLED=true,TELEGRAM_STARS_BOT_USERNAME=FSFESbot,TELEGRAM_STARS_TEST_MODE=false" \
  --set-secrets="TELEGRAM_STARS_BOT_TOKEN=TELEGRAM_STARS_BOT_TOKEN:${STARS_TOKEN_VERSION},TELEGRAM_STARS_WEBHOOK_SECRET=TELEGRAM_STARS_WEBHOOK_SECRET:${STARS_WEBHOOK_VERSION}"

STARS_URL=$(gcloud run services describe "$STARS_SERVICE" --project "$STARS_SERVICE_PROJECT" --region "$STARS_REGION" --format='value(status.url)')
echo "Stars service: ${STARS_URL}"
echo "Frontend endpoint: ${STARS_URL}/api/shop/stars"
echo "Webhook endpoint: ${STARS_URL}/api/telegram/stars/webhook"
echo 'Next: follow docs/telegram-stars-cloud-run.md to validate the service, publish the frontend, and register the webhook.'
