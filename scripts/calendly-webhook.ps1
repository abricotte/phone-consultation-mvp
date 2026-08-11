# ============================================================
# Création de l'abonnement webhook Calendly — en une fois.
#
# Ce script demande le jeton et la clé de signature au clavier :
# ils ne sont ni écrits sur le disque, ni affichés à l'écran,
# ni transmis ailleurs qu'à Calendly.
#
# Usage :  .\scripts\calendly-webhook.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Abonnement webhook Calendly ===" -ForegroundColor Cyan
Write-Host ""

# --- 1. Les deux secrets, saisis en aveugle -------------------
$jetonSecurise = Read-Host "Colle ton jeton Calendly (rien ne s'affiche, c'est normal)" -AsSecureString
$jeton = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($jetonSecurise))

$cleSecurisee = Read-Host "Colle ta clé de signature (celle mise dans Railway)" -AsSecureString
$cle = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($cleSecurisee))

if (-not $jeton -or -not $cle) {
  Write-Host "Jeton ou clé vide — on arrête là, rien n'a été envoyé." -ForegroundColor Red
  exit 1
}

$entetes = @{ Authorization = "Bearer $jeton" }

# --- 2. Qui es-tu pour Calendly ? -----------------------------
Write-Host ""
Write-Host "Interrogation de Calendly..." -ForegroundColor Gray
try {
  $moi = (Invoke-RestMethod -Uri "https://api.calendly.com/users/me" -Headers $entetes).resource
} catch {
  Write-Host ""
  Write-Host "Calendly refuse ce jeton (401 ?). Vérifie qu'il est collé en entier." -ForegroundColor Red
  exit 1
}

Write-Host "  Compte      : $($moi.name)" -ForegroundColor Green
Write-Host "  Utilisateur : $($moi.uri)"
Write-Host "  Organisation: $($moi.current_organization)"

# --- 3. L'abonnement existe-t-il déjà ? -----------------------
$URL_WEBHOOK = "https://phone-consultation-mvp-production.up.railway.app/api/calendly/webhook"

$existants = Invoke-RestMethod -Uri "https://api.calendly.com/webhook_subscriptions?organization=$($moi.current_organization)&scope=user&user=$($moi.uri)" -Headers $entetes
$deja = $existants.collection | Where-Object { $_.callback_url -eq $URL_WEBHOOK -and $_.state -eq "active" }
if ($deja) {
  Write-Host ""
  Write-Host "Un abonnement ACTIF existe déjà vers cette adresse — rien à créer." -ForegroundColor Yellow
  Write-Host "  $($deja.uri)"
  exit 0
}

# --- 4. Création ----------------------------------------------
$corps = @{
  url          = $URL_WEBHOOK
  events       = @("invitee.created", "invitee.canceled")
  organization = $moi.current_organization
  user         = $moi.uri
  scope        = "user"
  signing_key  = $cle
} | ConvertTo-Json

Write-Host ""
Write-Host "Création de l'abonnement..." -ForegroundColor Gray
try {
  $reponse = Invoke-RestMethod -Method Post -Uri "https://api.calendly.com/webhook_subscriptions" `
    -Headers ($entetes + @{ "Content-Type" = "application/json" }) -Body $corps
} catch {
  Write-Host ""
  Write-Host "Échec de la création :" -ForegroundColor Red
  # Le détail de l'erreur Calendly, sans jamais afficher les secrets
  try {
    $flux = $_.Exception.Response.GetResponseStream()
    $lecteur = New-Object System.IO.StreamReader($flux)
    Write-Host ("  " + $lecteur.ReadToEnd()) -ForegroundColor Red
  } catch { Write-Host "  $($_.Exception.Message)" -ForegroundColor Red }
  exit 1
}

Write-Host ""
if ($reponse.resource.state -eq "active") {
  Write-Host "=== C'EST EN PLACE ===" -ForegroundColor Green
  Write-Host "  État : $($reponse.resource.state)"
  Write-Host "  Vers : $($reponse.resource.callback_url)"
  Write-Host ""
  Write-Host "Test réel : réserve un créneau sur ton propre agenda Calendly,"
  Write-Host "puis regarde « Mes rendez-vous du jour » dans ton cabinet."
} else {
  Write-Host "Réponse inattendue — état : $($reponse.resource.state)" -ForegroundColor Yellow
}
