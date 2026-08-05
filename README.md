# Rewise

## Background reminders

Rewise uses the Web Push standard: reminders can be delivered when the site tab is closed, provided the browser and device still support background push. The browser or operating system controls the alert sound while the site is closed; web platforms deliberately do not allow a locally selected MP3 to autoplay in that state. Rewise plays the selected device-local sound when the app is already open.

### Production configuration

Generate VAPID keys once and add the values to the deployment's secret manager:

```bash
npm run generate:vapid
```

Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (a `mailto:` URL). These values must remain stable: changing them makes existing browser subscriptions invalid. Set `REMINDER_STORE_PATH` to private, durable storage. Never place that file under `public/`.

The current scheduler is process-based, so production needs an always-running single instance with durable storage. For scale-to-zero/serverless hosting, move the reminder store and scheduler to a managed database and scheduled worker (for example, Cloud Scheduler + Cloud Run, or a queue worker). Without that infrastructure, no website can guarantee a notification after the hosting process has stopped.

Notifications also require HTTPS (except `localhost`), user permission, and a browser with service-worker Push support. Focus/Do Not Disturb settings can still suppress the device alert.
