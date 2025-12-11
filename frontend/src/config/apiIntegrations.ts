/**
 * API Integrations Configuration
 * Loads API integrations from shared/apiIntegrations/ directory
 * Each API integration is stored in a separate JSON file for better maintainability
 */

import type { ApiIntegration } from '../types/apiIntegrations';

// Import index.json to get list of all available integrations
// @ts-ignore - Vite handles JSON imports, but TypeScript needs help
import indexData from '../../../shared/apiIntegrations/index.json';

// Import all API integration files
// @ts-ignore
import pipedriveData from '../../../shared/apiIntegrations/pipedrive.json';
// @ts-ignore
import salesforceData from '../../../shared/apiIntegrations/salesforce.json';
// @ts-ignore
import slackData from '../../../shared/apiIntegrations/slack.json';
// @ts-ignore
import hubspotData from '../../../shared/apiIntegrations/hubspot.json';
// @ts-ignore
import shopifyData from '../../../shared/apiIntegrations/shopify.json';
// @ts-ignore
import stripeData from '../../../shared/apiIntegrations/stripe.json';
// @ts-ignore
import googleSheetsData from '../../../shared/apiIntegrations/google-sheets.json';
// @ts-ignore
import jiraData from '../../../shared/apiIntegrations/jira.json';
// @ts-ignore
import airtableData from '../../../shared/apiIntegrations/airtable.json';
// @ts-ignore
import notionData from '../../../shared/apiIntegrations/notion.json';
// @ts-ignore
import zendeskData from '../../../shared/apiIntegrations/zendesk.json';
// @ts-ignore
import twilioData from '../../../shared/apiIntegrations/twilio.json';
// @ts-ignore
import githubData from '../../../shared/apiIntegrations/github.json';
// @ts-ignore
import trelloData from '../../../shared/apiIntegrations/trello.json';
// @ts-ignore
import asanaData from '../../../shared/apiIntegrations/asana.json';
// @ts-ignore
import mailchimpData from '../../../shared/apiIntegrations/mailchimp.json';
// @ts-ignore
import zoomData from '../../../shared/apiIntegrations/zoom.json';
// @ts-ignore
import clickupData from '../../../shared/apiIntegrations/clickup.json';
// @ts-ignore
import mondayData from '../../../shared/apiIntegrations/monday.json';
// @ts-ignore
import intercomData from '../../../shared/apiIntegrations/intercom.json';
// @ts-ignore
import sendgridData from '../../../shared/apiIntegrations/sendgrid.json';
// @ts-ignore
import discordData from '../../../shared/apiIntegrations/discord.json';
// @ts-ignore
import telegramData from '../../../shared/apiIntegrations/telegram.json';
// @ts-ignore
import woocommerceData from '../../../shared/apiIntegrations/woocommerce.json';
// @ts-ignore
import paypalData from '../../../shared/apiIntegrations/paypal.json';
// @ts-ignore
import linearData from '../../../shared/apiIntegrations/linear.json';
// @ts-ignore
import mongodbData from '../../../shared/apiIntegrations/mongodb.json';
// @ts-ignore
import postgresqlData from '../../../shared/apiIntegrations/postgresql.json';
// @ts-ignore
import mysqlData from '../../../shared/apiIntegrations/mysql.json';
// @ts-ignore
import twitterData from '../../../shared/apiIntegrations/twitter.json';
// @ts-ignore
import linkedinData from '../../../shared/apiIntegrations/linkedin.json';
// @ts-ignore
import microsoftTeamsData from '../../../shared/apiIntegrations/microsoft-teams.json';
// @ts-ignore
import microsoftOutlookData from '../../../shared/apiIntegrations/microsoft-outlook.json';
// @ts-ignore
import microsoftOnedriveData from '../../../shared/apiIntegrations/microsoft-onedrive.json';
// @ts-ignore
import microsoftSharepointData from '../../../shared/apiIntegrations/microsoft-sharepoint.json';
// @ts-ignore
import whatsappData from '../../../shared/apiIntegrations/whatsapp.json';
// @ts-ignore
import messagebirdData from '../../../shared/apiIntegrations/messagebird.json';
// @ts-ignore
import vonageData from '../../../shared/apiIntegrations/vonage.json';
// @ts-ignore
import mattermostData from '../../../shared/apiIntegrations/mattermost.json';
// @ts-ignore
import copperData from '../../../shared/apiIntegrations/copper.json';
// @ts-ignore
import freshworksCrmData from '../../../shared/apiIntegrations/freshworks-crm.json';
// @ts-ignore
import activecampaignData from '../../../shared/apiIntegrations/activecampaign.json';
// @ts-ignore
import salesmateData from '../../../shared/apiIntegrations/salesmate.json';
// @ts-ignore
import keapData from '../../../shared/apiIntegrations/keap.json';
// @ts-ignore
import mailgunData from '../../../shared/apiIntegrations/mailgun.json';
// @ts-ignore
import postmarkData from '../../../shared/apiIntegrations/postmark.json';
// @ts-ignore
import supabaseData from '../../../shared/apiIntegrations/supabase.json';
// @ts-ignore
import quickbooksOnlineData from '../../../shared/apiIntegrations/quickbooks-online.json';
// @ts-ignore
import xeroData from '../../../shared/apiIntegrations/xero.json';
// @ts-ignore
import helpscoutData from '../../../shared/apiIntegrations/helpscout.json';
// @ts-ignore
import servicenowData from '../../../shared/apiIntegrations/servicenow.json';
// @ts-ignore
import todoistData from '../../../shared/apiIntegrations/todoist.json';
// @ts-ignore
import harvestData from '../../../shared/apiIntegrations/harvest.json';
// @ts-ignore
import clockifyData from '../../../shared/apiIntegrations/clockify.json';
// @ts-ignore
import togglData from '../../../shared/apiIntegrations/toggl.json';
// @ts-ignore
import gumroadData from '../../../shared/apiIntegrations/gumroad.json';
// @ts-ignore
import magento2Data from '../../../shared/apiIntegrations/magento2.json';
// @ts-ignore
import paddleData from '../../../shared/apiIntegrations/paddle.json';
// @ts-ignore
import chargebeeData from '../../../shared/apiIntegrations/chargebee.json';
// @ts-ignore
import brevoData from '../../../shared/apiIntegrations/brevo.json';
// @ts-ignore
import convertkitData from '../../../shared/apiIntegrations/convertkit.json';
// @ts-ignore
import freshdeskData from '../../../shared/apiIntegrations/freshdesk.json';
// @ts-ignore
import freshserviceData from '../../../shared/apiIntegrations/freshservice.json';
// @ts-ignore
import gitlabData from '../../../shared/apiIntegrations/gitlab.json';
// @ts-ignore
import bitbucketData from '../../../shared/apiIntegrations/bitbucket.json';
// @ts-ignore
import typeformData from '../../../shared/apiIntegrations/typeform.json';
// @ts-ignore
import jotformData from '../../../shared/apiIntegrations/jotform.json';
// @ts-ignore
import calendlyData from '../../../shared/apiIntegrations/calendly.json';
// @ts-ignore
import awsS3Data from '../../../shared/apiIntegrations/aws-s3.json';
// @ts-ignore
import googleDriveData from '../../../shared/apiIntegrations/google-drive.json';
// @ts-ignore
import dropboxData from '../../../shared/apiIntegrations/dropbox.json';
// @ts-ignore
import boxData from '../../../shared/apiIntegrations/box.json';
// @ts-ignore
import googleAnalyticsData from '../../../shared/apiIntegrations/google-analytics.json';
// @ts-ignore
import posthogData from '../../../shared/apiIntegrations/posthog.json';
// @ts-ignore
import segmentData from '../../../shared/apiIntegrations/segment.json';
// @ts-ignore
import contentfulData from '../../../shared/apiIntegrations/contentful.json';
// @ts-ignore
import storyblokData from '../../../shared/apiIntegrations/storyblok.json';
// @ts-ignore
import strapiData from '../../../shared/apiIntegrations/strapi.json';
// @ts-ignore
import ghostData from '../../../shared/apiIntegrations/ghost.json';
// @ts-ignore
import wordpressData from '../../../shared/apiIntegrations/wordpress.json';
// @ts-ignore
import webflowData from '../../../shared/apiIntegrations/webflow.json';
// @ts-ignore
import openaiData from '../../../shared/apiIntegrations/openai.json';
// @ts-ignore
import mistralAiData from '../../../shared/apiIntegrations/mistral-ai.json';
// @ts-ignore
import deeplData from '../../../shared/apiIntegrations/deepl.json';
// @ts-ignore
import zohoCrmData from '../../../shared/apiIntegrations/zoho-crm.json';
// @ts-ignore
import oktaData from '../../../shared/apiIntegrations/okta.json';
// @ts-ignore
import odooData from '../../../shared/apiIntegrations/odoo.json';
// @ts-ignore
import codaData from '../../../shared/apiIntegrations/coda.json';
// @ts-ignore
import bannerbearData from '../../../shared/apiIntegrations/bannerbear.json';
// @ts-ignore
import mindeeData from '../../../shared/apiIntegrations/mindee.json';
// @ts-ignore
import baserowData from '../../../shared/apiIntegrations/baserow.json';
// @ts-ignore
import microsoftExcelData from '../../../shared/apiIntegrations/microsoft-excel.json';
// @ts-ignore
import microsoftTodoData from '../../../shared/apiIntegrations/microsoft-todo.json';
// @ts-ignore
import microsoftEntraData from '../../../shared/apiIntegrations/microsoft-entra.json';
// @ts-ignore
import microsoftDynamicsCrmData from '../../../shared/apiIntegrations/microsoft-dynamics-crm.json';
// @ts-ignore
import azureCosmosDbData from '../../../shared/apiIntegrations/azure-cosmos-db.json';
// @ts-ignore
import azureStorageData from '../../../shared/apiIntegrations/azure-storage.json';
// @ts-ignore
import jenkinsData from '../../../shared/apiIntegrations/jenkins.json';
// @ts-ignore
import netlifyData from '../../../shared/apiIntegrations/netlify.json';
// @ts-ignore
import googleCalendarData from '../../../shared/apiIntegrations/google-calendar.json';
// @ts-ignore
import grafanaData from '../../../shared/apiIntegrations/grafana.json';
// @ts-ignore
import sentryData from '../../../shared/apiIntegrations/sentry.json';
// @ts-ignore
import facebookGraphData from '../../../shared/apiIntegrations/facebook-graph.json';
// @ts-ignore
import facebookLeadAdsData from '../../../shared/apiIntegrations/facebook-lead-ads.json';
// @ts-ignore
import circleciData from '../../../shared/apiIntegrations/circleci.json';
// @ts-ignore
import travisciData from '../../../shared/apiIntegrations/travisci.json';
// @ts-ignore
import uptimerobotData from '../../../shared/apiIntegrations/uptimerobot.json';
// @ts-ignore
import securityscorecardData from '../../../shared/apiIntegrations/securityscorecard.json';
// @ts-ignore
import wiseData from '../../../shared/apiIntegrations/wise.json';
// @ts-ignore
import invoiceNinjaData from '../../../shared/apiIntegrations/invoice-ninja.json';
// @ts-ignore
import rocketchatData from '../../../shared/apiIntegrations/rocketchat.json';
// @ts-ignore
import lineNotifyData from '../../../shared/apiIntegrations/line-notify.json';
// @ts-ignore
import redditData from '../../../shared/apiIntegrations/reddit.json';
// @ts-ignore
import mediumData from '../../../shared/apiIntegrations/medium.json';
// @ts-ignore
import hackerNewsData from '../../../shared/apiIntegrations/hacker-news.json';
// @ts-ignore
import metabaseData from '../../../shared/apiIntegrations/metabase.json';
// @ts-ignore
import mandrillData from '../../../shared/apiIntegrations/mandrill.json';
// @ts-ignore
import mailjetData from '../../../shared/apiIntegrations/mailjet.json';
// @ts-ignore
import nextcloudData from '../../../shared/apiIntegrations/nextcloud.json';
// @ts-ignore
import gristData from '../../../shared/apiIntegrations/grist.json';
// @ts-ignore
import seatableData from '../../../shared/apiIntegrations/seatable.json';
// @ts-ignore
import nocodbData from '../../../shared/apiIntegrations/nocodb.json';
// @ts-ignore
import stackbyData from '../../../shared/apiIntegrations/stackby.json';
// @ts-ignore
import taigaData from '../../../shared/apiIntegrations/taiga.json';
// @ts-ignore
import wekanData from '../../../shared/apiIntegrations/wekan.json';
// @ts-ignore
import orbitData from '../../../shared/apiIntegrations/orbit.json';
// @ts-ignore
import profitwellData from '../../../shared/apiIntegrations/profitwell.json';
// @ts-ignore
import tapfiliateData from '../../../shared/apiIntegrations/tapfiliate.json';
// @ts-ignore
import formstackData from '../../../shared/apiIntegrations/formstack.json';
// @ts-ignore
import formioData from '../../../shared/apiIntegrations/formio.json';
// @ts-ignore
import wufooData from '../../../shared/apiIntegrations/wufoo.json';
// @ts-ignore
import surveymonkeyData from '../../../shared/apiIntegrations/surveymonkey.json';
// @ts-ignore
import kobotoolboxData from '../../../shared/apiIntegrations/kobotoolbox.json';
// @ts-ignore
import acuitySchedulingData from '../../../shared/apiIntegrations/acuity-scheduling.json';
// @ts-ignore
import gotowebinarData from '../../../shared/apiIntegrations/gotowebinar.json';
// @ts-ignore
import eventbriteData from '../../../shared/apiIntegrations/eventbrite.json';
// @ts-ignore
import zammadData from '../../../shared/apiIntegrations/zammad.json';
// @ts-ignore
import gongData from '../../../shared/apiIntegrations/gong.json';
// @ts-ignore
import erpnextData from '../../../shared/apiIntegrations/erpnext.json';
// @ts-ignore
import quickbaseData from '../../../shared/apiIntegrations/quickbase.json';
// @ts-ignore
import filemakerData from '../../../shared/apiIntegrations/filemaker.json';
// @ts-ignore
import perplexityData from '../../../shared/apiIntegrations/perplexity.json';
// @ts-ignore
import jinaAiData from '../../../shared/apiIntegrations/jina-ai.json';
// @ts-ignore
import humanticAiData from '../../../shared/apiIntegrations/humantic-ai.json';
// @ts-ignore
import rundeckData from '../../../shared/apiIntegrations/rundeck.json';
// @ts-ignore
import unleashedSoftwareData from '../../../shared/apiIntegrations/unleashed-software.json';
// @ts-ignore
import sms77Data from '../../../shared/apiIntegrations/sms77.json';
// @ts-ignore
import moceanData from '../../../shared/apiIntegrations/mocean.json';
// @ts-ignore
import spontitData from '../../../shared/apiIntegrations/spontit.json';
// @ts-ignore
import pushbulletData from '../../../shared/apiIntegrations/pushbullet.json';
// @ts-ignore
import pushoverData from '../../../shared/apiIntegrations/pushover.json';
// @ts-ignore
import gotifyData from '../../../shared/apiIntegrations/gotify.json';
// @ts-ignore
import matrixData from '../../../shared/apiIntegrations/matrix.json';
// @ts-ignore
import calData from '../../../shared/apiIntegrations/cal.json';
// @ts-ignore
import microsoftGraphSecurityData from '../../../shared/apiIntegrations/microsoft-graph-security.json';
// @ts-ignore
import affinityData from '../../../shared/apiIntegrations/affinity.json';
// @ts-ignore
import agileCrmData from '../../../shared/apiIntegrations/agile-crm.json';
// @ts-ignore
import autopilotData from '../../../shared/apiIntegrations/autopilot.json';
// @ts-ignore
import egoiData from '../../../shared/apiIntegrations/egoi.json';
// @ts-ignore
import getresponseData from '../../../shared/apiIntegrations/getresponse.json';
// @ts-ignore
import lemlistData from '../../../shared/apiIntegrations/lemlist.json';
// @ts-ignore
import mailerliteData from '../../../shared/apiIntegrations/mailerlite.json';
// @ts-ignore
import sendyData from '../../../shared/apiIntegrations/sendy.json';
// @ts-ignore
import mauticData from '../../../shared/apiIntegrations/mautic.json';
// @ts-ignore
import thehiveData from '../../../shared/apiIntegrations/thehive.json';
// @ts-ignore
import cortexData from '../../../shared/apiIntegrations/cortex.json';
// @ts-ignore
import elasticSecurityData from '../../../shared/apiIntegrations/elastic-security.json';
// @ts-ignore
import ciscoWebexData from '../../../shared/apiIntegrations/cisco-webex.json';
// @ts-ignore
import oneSimpleApiData from '../../../shared/apiIntegrations/one-simple-api.json';
// @ts-ignore
import thehive5Data from '../../../shared/apiIntegrations/thehive5.json';
// @ts-ignore
import cockpitData from '../../../shared/apiIntegrations/cockpit.json';
// @ts-ignore
import adaloData from '../../../shared/apiIntegrations/adalo.json';
// @ts-ignore
import bubbleData from '../../../shared/apiIntegrations/bubble.json';
// @ts-ignore
import customerioData from '../../../shared/apiIntegrations/customerio.json';
// @ts-ignore
import googleDocsData from '../../../shared/apiIntegrations/google-docs.json';
// @ts-ignore
import googleTranslateData from '../../../shared/apiIntegrations/google-translate.json';
// @ts-ignore
import airtopData from '../../../shared/apiIntegrations/airtop.json';
// @ts-ignore
import flowData from '../../../shared/apiIntegrations/flow.json';
// @ts-ignore
import bitwardenData from '../../../shared/apiIntegrations/bitwarden.json';
// @ts-ignore
import zulipData from '../../../shared/apiIntegrations/zulip.json';
// @ts-ignore
import beeminderData from '../../../shared/apiIntegrations/beeminder.json';
// @ts-ignore
import onfleetData from '../../../shared/apiIntegrations/onfleet.json';
// @ts-ignore
import googleChatData from '../../../shared/apiIntegrations/google-chat.json';
// @ts-ignore
import googleBigQueryData from '../../../shared/apiIntegrations/google-bigquery.json';
// @ts-ignore
import googleGsuiteAdminData from '../../../shared/apiIntegrations/google-gsuite-admin.json';
// @ts-ignore
import googleYoutubeData from '../../../shared/apiIntegrations/google-youtube.json';
// @ts-ignore
import figmaData from '../../../shared/apiIntegrations/figma.json';
// @ts-ignore
import spotifyData from '../../../shared/apiIntegrations/spotify.json';
// @ts-ignore
import pagerdutyData from '../../../shared/apiIntegrations/pagerduty.json';
// @ts-ignore
import stravaData from '../../../shared/apiIntegrations/strava.json';
// @ts-ignore
import splunkData from '../../../shared/apiIntegrations/splunk.json';
// @ts-ignore
import workableData from '../../../shared/apiIntegrations/workable.json';
// @ts-ignore
import bamboohrData from '../../../shared/apiIntegrations/bamboohr.json';
// @ts-ignore
import iterableData from '../../../shared/apiIntegrations/iterable.json';
// @ts-ignore
import driftData from '../../../shared/apiIntegrations/drift.json';
// @ts-ignore
import discourseData from '../../../shared/apiIntegrations/discourse.json';
// @ts-ignore
import disqusData from '../../../shared/apiIntegrations/disqus.json';
// @ts-ignore
import highlevelData from '../../../shared/apiIntegrations/highlevel.json';
// @ts-ignore
import hunterData from '../../../shared/apiIntegrations/hunter.json';
// @ts-ignore
import clearbitData from '../../../shared/apiIntegrations/clearbit.json';
// @ts-ignore
import brandfetchData from '../../../shared/apiIntegrations/brandfetch.json';
// @ts-ignore
import dropcontactData from '../../../shared/apiIntegrations/dropcontact.json';
// @ts-ignore
import upleadData from '../../../shared/apiIntegrations/uplead.json';
// @ts-ignore
import cratedbData from '../../../shared/apiIntegrations/cratedb.json';
// @ts-ignore
import questdbData from '../../../shared/apiIntegrations/questdb.json';
// @ts-ignore
import timescaledbData from '../../../shared/apiIntegrations/timescaledb.json';
// @ts-ignore
import snowflakeData from '../../../shared/apiIntegrations/snowflake.json';
// @ts-ignore
import mispData from '../../../shared/apiIntegrations/misp.json';
// @ts-ignore
import uprocData from '../../../shared/apiIntegrations/uproc.json';
// @ts-ignore
import kitemakerData from '../../../shared/apiIntegrations/kitemaker.json';
// @ts-ignore
import emeliaData from '../../../shared/apiIntegrations/emelia.json';

// Map of API IDs to their data
const apiDataMap: Record<string, ApiIntegration> = {
  pipedrive: pipedriveData as ApiIntegration,
  salesforce: salesforceData as ApiIntegration,
  slack: slackData as ApiIntegration,
  hubspot: hubspotData as ApiIntegration,
  shopify: shopifyData as ApiIntegration,
  stripe: stripeData as ApiIntegration,
  'google-sheets': googleSheetsData as ApiIntegration,
  jira: jiraData as ApiIntegration,
  airtable: airtableData as ApiIntegration,
  notion: notionData as ApiIntegration,
  zendesk: zendeskData as ApiIntegration,
  twilio: twilioData as ApiIntegration,
  github: githubData as ApiIntegration,
  trello: trelloData as unknown as ApiIntegration,
  asana: asanaData as ApiIntegration,
  mailchimp: mailchimpData as ApiIntegration,
  zoom: zoomData as ApiIntegration,
  clickup: clickupData as ApiIntegration,
  monday: mondayData as ApiIntegration,
  intercom: intercomData as ApiIntegration,
  sendgrid: sendgridData as ApiIntegration,
  discord: discordData as ApiIntegration,
  telegram: telegramData as ApiIntegration,
  woocommerce: woocommerceData as ApiIntegration,
  paypal: paypalData as ApiIntegration,
  linear: linearData as ApiIntegration,
  mongodb: mongodbData as ApiIntegration,
  postgresql: postgresqlData as ApiIntegration,
  mysql: mysqlData as ApiIntegration,
  twitter: twitterData as ApiIntegration,
  linkedin: linkedinData as ApiIntegration,
  'microsoft-teams': microsoftTeamsData as ApiIntegration,
  'microsoft-outlook': microsoftOutlookData as ApiIntegration,
  'microsoft-onedrive': microsoftOnedriveData as ApiIntegration,
  'microsoft-sharepoint': microsoftSharepointData as ApiIntegration,
  whatsapp: whatsappData as ApiIntegration,
  messagebird: messagebirdData as ApiIntegration,
  vonage: vonageData as ApiIntegration,
  mattermost: mattermostData as ApiIntegration,
  copper: copperData as ApiIntegration,
  'freshworks-crm': freshworksCrmData as ApiIntegration,
  activecampaign: activecampaignData as ApiIntegration,
  salesmate: salesmateData as ApiIntegration,
  keap: keapData as ApiIntegration,
  mailgun: mailgunData as ApiIntegration,
  postmark: postmarkData as ApiIntegration,
  supabase: supabaseData as ApiIntegration,
  'quickbooks-online': quickbooksOnlineData as ApiIntegration,
  xero: xeroData as ApiIntegration,
  helpscout: helpscoutData as ApiIntegration,
  servicenow: servicenowData as ApiIntegration,
  todoist: todoistData as ApiIntegration,
  harvest: harvestData as ApiIntegration,
  clockify: clockifyData as ApiIntegration,
  toggl: togglData as ApiIntegration,
  gumroad: gumroadData as ApiIntegration,
  magento2: magento2Data as ApiIntegration,
  paddle: paddleData as ApiIntegration,
  chargebee: chargebeeData as ApiIntegration,
  brevo: brevoData as ApiIntegration,
  convertkit: convertkitData as ApiIntegration,
  freshdesk: freshdeskData as ApiIntegration,
  freshservice: freshserviceData as ApiIntegration,
  gitlab: gitlabData as ApiIntegration,
  bitbucket: bitbucketData as ApiIntegration,
  typeform: typeformData as ApiIntegration,
  jotform: jotformData as ApiIntegration,
  calendly: calendlyData as ApiIntegration,
  'aws-s3': awsS3Data as ApiIntegration,
  'google-drive': googleDriveData as ApiIntegration,
  dropbox: dropboxData as ApiIntegration,
  box: boxData as ApiIntegration,
  'google-analytics': googleAnalyticsData as ApiIntegration,
  posthog: posthogData as ApiIntegration,
  segment: segmentData as ApiIntegration,
  contentful: contentfulData as ApiIntegration,
  storyblok: storyblokData as ApiIntegration,
  strapi: strapiData as ApiIntegration,
  ghost: ghostData as ApiIntegration,
  wordpress: wordpressData as ApiIntegration,
  webflow: webflowData as ApiIntegration,
  openai: openaiData as ApiIntegration,
  'mistral-ai': mistralAiData as ApiIntegration,
  deepl: deeplData as ApiIntegration,
  'zoho-crm': zohoCrmData as ApiIntegration,
  okta: oktaData as ApiIntegration,
  odoo: odooData as ApiIntegration,
  coda: codaData as ApiIntegration,
  bannerbear: bannerbearData as ApiIntegration,
  mindee: mindeeData as ApiIntegration,
  'microsoft-excel': microsoftExcelData as ApiIntegration,
  'microsoft-todo': microsoftTodoData as ApiIntegration,
  'microsoft-entra': microsoftEntraData as ApiIntegration,
  'microsoft-dynamics-crm': microsoftDynamicsCrmData as ApiIntegration,
  'azure-cosmos-db': azureCosmosDbData as unknown as ApiIntegration,
  'azure-storage': azureStorageData as unknown as ApiIntegration,
  jenkins: jenkinsData as ApiIntegration,
  netlify: netlifyData as ApiIntegration,
  'google-calendar': googleCalendarData as ApiIntegration,
  grafana: grafanaData as ApiIntegration,
  sentry: sentryData as ApiIntegration,
  'facebook-graph': facebookGraphData as ApiIntegration,
  'facebook-lead-ads': facebookLeadAdsData as ApiIntegration,
  circleci: circleciData as ApiIntegration,
  travisci: travisciData as ApiIntegration,
  uptimerobot: uptimerobotData as ApiIntegration,
  securityscorecard: securityscorecardData as ApiIntegration,
  wise: wiseData as ApiIntegration,
  'invoice-ninja': invoiceNinjaData as ApiIntegration,
  rocketchat: rocketchatData as ApiIntegration,
  'line-notify': lineNotifyData as ApiIntegration,
  reddit: redditData as ApiIntegration,
  medium: mediumData as ApiIntegration,
  'hacker-news': hackerNewsData as ApiIntegration,
  metabase: metabaseData as ApiIntegration,
  mandrill: mandrillData as ApiIntegration,
  mailjet: mailjetData as ApiIntegration,
  nextcloud: nextcloudData as unknown as ApiIntegration,
  taiga: taigaData as ApiIntegration,
  wekan: wekanData as ApiIntegration,
  orbit: orbitData as ApiIntegration,
  profitwell: profitwellData as ApiIntegration,
  tapfiliate: tapfiliateData as ApiIntegration,
  formstack: formstackData as ApiIntegration,
  formio: formioData as ApiIntegration,
  wufoo: wufooData as ApiIntegration,
  surveymonkey: surveymonkeyData as ApiIntegration,
  kobotoolbox: kobotoolboxData as ApiIntegration,
  'acuity-scheduling': acuitySchedulingData as ApiIntegration,
  gotowebinar: gotowebinarData as ApiIntegration,
  eventbrite: eventbriteData as ApiIntegration,
  zammad: zammadData as ApiIntegration,
  gong: gongData as ApiIntegration,
  erpnext: erpnextData as ApiIntegration,
  quickbase: quickbaseData as ApiIntegration,
  filemaker: filemakerData as ApiIntegration,
  perplexity: perplexityData as ApiIntegration,
  'jina-ai': jinaAiData as unknown as ApiIntegration,
  'humantic-ai': humanticAiData as ApiIntegration,
  rundeck: rundeckData as ApiIntegration,
  'unleashed-software': unleashedSoftwareData as ApiIntegration,
  sms77: sms77Data as ApiIntegration,
  mocean: moceanData as ApiIntegration,
  spontit: spontitData as ApiIntegration,
  pushbullet: pushbulletData as ApiIntegration,
  pushover: pushoverData as ApiIntegration,
  gotify: gotifyData as ApiIntegration,
  matrix: matrixData as ApiIntegration,
  cal: calData as ApiIntegration,
  'microsoft-graph-security': microsoftGraphSecurityData as ApiIntegration,
  affinity: affinityData as ApiIntegration,
  'agile-crm': agileCrmData as ApiIntegration,
  autopilot: autopilotData as ApiIntegration,
  egoi: egoiData as ApiIntegration,
  getresponse: getresponseData as ApiIntegration,
  lemlist: lemlistData as ApiIntegration,
  mailerlite: mailerliteData as ApiIntegration,
  sendy: sendyData as ApiIntegration,
  mautic: mauticData as ApiIntegration,
  thehive: thehiveData as ApiIntegration,
  cortex: cortexData as ApiIntegration,
  'elastic-security': elasticSecurityData as ApiIntegration,
  'cisco-webex': ciscoWebexData as ApiIntegration,
  'one-simple-api': oneSimpleApiData as ApiIntegration,
  thehive5: thehive5Data as ApiIntegration,
  cockpit: cockpitData as ApiIntegration,
  adalo: adaloData as ApiIntegration,
  bubble: bubbleData as ApiIntegration,
  customerio: customerioData as ApiIntegration,
  'google-docs': googleDocsData as ApiIntegration,
  'google-translate': googleTranslateData as ApiIntegration,
  airtop: airtopData as ApiIntegration,
  flow: flowData as ApiIntegration,
  bitwarden: bitwardenData as ApiIntegration,
  zulip: zulipData as ApiIntegration,
  beeminder: beeminderData as ApiIntegration,
  onfleet: onfleetData as ApiIntegration,
  'google-chat': googleChatData as ApiIntegration,
  'google-bigquery': googleBigQueryData as ApiIntegration,
  'google-gsuite-admin': googleGsuiteAdminData as ApiIntegration,
  'google-youtube': googleYoutubeData as ApiIntegration,
  figma: figmaData as ApiIntegration,
  spotify: spotifyData as ApiIntegration,
  pagerduty: pagerdutyData as ApiIntegration,
  strava: stravaData as ApiIntegration,
  splunk: splunkData as ApiIntegration,
  workable: workableData as ApiIntegration,
  bamboohr: bamboohrData as ApiIntegration,
  iterable: iterableData as ApiIntegration,
  drift: driftData as ApiIntegration,
  discourse: discourseData as ApiIntegration,
  disqus: disqusData as ApiIntegration,
  highlevel: highlevelData as ApiIntegration,
  hunter: hunterData as ApiIntegration,
  clearbit: clearbitData as ApiIntegration,
  brandfetch: brandfetchData as ApiIntegration,
  dropcontact: dropcontactData as ApiIntegration,
  uplead: upleadData as ApiIntegration,
  nocodb: nocodbData as ApiIntegration,
  baserow: baserowData as ApiIntegration,
  seatable: seatableData as ApiIntegration,
  grist: gristData as ApiIntegration,
  stackby: stackbyData as ApiIntegration,
  cratedb: cratedbData as ApiIntegration,
  questdb: questdbData as ApiIntegration,
  timescaledb: timescaledbData as ApiIntegration,
  snowflake: snowflakeData as ApiIntegration,
  misp: mispData as ApiIntegration,
  uproc: uprocData as ApiIntegration,
  kitemaker: kitemakerData as ApiIntegration,
  emelia: emeliaData as ApiIntegration,
};

// Cache for loaded integrations
let cachedApiIntegrations: ApiIntegration[] | null = null;

/**
 * Load API integrations from separate JSON files
 * This should be called once at app startup
 */
export async function loadApiIntegrations(): Promise<ApiIntegration[]> {
  if (cachedApiIntegrations) {
    // console.log('[API Integrations] Using cached integrations', { count: cachedApiIntegrations.length });
    return cachedApiIntegrations;
  }

  try {
    // console.log('[API Integrations] Loading API integrations from separate files...');
    
    const index = indexData as { integrations: Array<{ id: string; file: string; category: string; status?: string }> };
    const integrations: ApiIntegration[] = [];
    const seenIds = new Set<string>();

    // Load each integration from the index, filtering duplicates
    for (const integrationInfo of index.integrations) {
      // Skip if we've already seen this ID
      if (seenIds.has(integrationInfo.id)) {
        // console.warn(`[API Integrations] Duplicate entry found for ${integrationInfo.id}, skipping`);
        continue;
      }
      
      seenIds.add(integrationInfo.id);
      const apiData = apiDataMap[integrationInfo.id];
      if (apiData) {
        integrations.push(apiData);
        // console.log(`[API Integrations] Loaded ${integrationInfo.id} from ${integrationInfo.file}`);
      } else {
        // console.warn(`[API Integrations] Missing data for ${integrationInfo.id} (file: ${integrationInfo.file})`);
      }
    }

    cachedApiIntegrations = integrations;
    // console.log('[API Integrations] Loaded API integrations', { 
    //   count: integrations.length,
    //   apis: integrations.map(api => api.name)
    // });
    
    if (integrations.length === 0) {
      console.warn('[API Integrations] No integrations found');
    }
    
    return integrations;
  } catch (error) {
    console.error('[API Integrations] Error loading API integrations:', error);
    return [];
  }
}

/**
 * Get all API integrations
 */
export function getApiIntegrations(): ApiIntegration[] {
  return cachedApiIntegrations || [];
}

/**
 * Get API integration by ID
 * Works with both cached integrations (after loadApiIntegrations) and direct apiDataMap access
 * This ensures it works synchronously even if integrations haven't been loaded yet
 */
export function getApiIntegration(apiId: string): ApiIntegration | undefined {
  // First try cached (if loaded)
  if (cachedApiIntegrations) {
    const cached = cachedApiIntegrations.find(api => api.id === apiId);
    if (cached) return cached;
  }
  // Fallback to direct map access (synchronous, works immediately)
  return apiDataMap[apiId];
}

/**
 * Get endpoint by API ID and endpoint ID
 */
export function getApiEndpoint(apiId: string, endpointId: string) {
  const api = getApiIntegration(apiId);
  return api?.endpoints.find(endpoint => endpoint.id === endpointId);
}
