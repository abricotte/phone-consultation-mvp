# ============================================================
# Calendly : diagnostic ET rattrapage, en une seule commande.
#
# Repond a trois questions que les journaux Railway ne montrent pas :
#   1. L'abonnement webhook existe-t-il, et pointe-t-il ou il faut ?
#   2. Y a-t-il des rendez-vous a venir chez Calendly ?
#   3. Si oui : les injecter dans le cabinet.
#
# Le rattrapage rejoue les reservations en passant par le VRAI webhook,
# signees avec la vraie cle. Deux consequences utiles : aucun code
# serveur en plus, et si l'injection marche, cela PROUVE que la cle de
# signature est la bonne.
#
# NOTE : ASCII pur - PowerShell 5.1 lit les scripts sans BOM en ANSI,
# un tiret long y devient un guillemet fermant et casse la syntaxe.
#
# Usage : powershell -ExecutionPolicy Bypass -File C:\Users\evaow\phone-consultation-mvp\scripts\calendly-diagnostic.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$URL_WEBHOOK = "https://phone-consultation-mvp-production.up.railway.app/api/calendly/webhook"

Write-Host ""
Write-Host "=== Diagnostic Calendly ===" -ForegroundColor Cyan
Write-Host ""

# --- Secrets, saisis en aveugle -------------------------------
$s1 = Read-Host "Jeton Calendly (rien ne s'affiche, c'est normal)" -AsSecureString
$jeton = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($s1))
if (-not $jeton) { Write-Host "Jeton vide - arret." -ForegroundColor Red; exit 1 }

$entetes = @{ Authorization = "Bearer $jeton" }

# --- 1. Qui es-tu ---------------------------------------------
try {
  $moi = (Invoke-RestMethod -Uri "https://api.calendly.com/users/me" -Headers $entetes).resource
} catch {
  Write-Host "Calendly refuse ce jeton. Verifie qu'il est colle en entier." -ForegroundColor Red
  exit 1
}
Write-Host ("Compte : " + $moi.name) -ForegroundColor Green

# --- 2. L'abonnement webhook ----------------------------------
Write-Host ""
Write-Host "--- Abonnements webhook ---" -ForegroundColor Cyan
$urlAbos = "https://api.calendly.com/webhook_subscriptions?organization=" + $moi.current_organization + "`&scope=user`&user=" + $moi.uri
try {
  $abos = (Invoke-RestMethod -Uri $urlAbos -Headers $entetes).collection
  if (-not $abos -or $abos.Count -eq 0) {
    Write-Host "  AUCUN abonnement. C'est la raison : Calendly n'envoie rien." -ForegroundColor Red
  }
  foreach ($a in $abos) {
    $bon = ($a.callback_url -eq $URL_WEBHOOK)
    $couleur = if ($bon -and $a.state -eq "active") { "Green" } else { "Yellow" }
    Write-Host ("  Etat    : " + $a.state) -ForegroundColor $couleur
    Write-Host ("  Adresse : " + $a.callback_url)
    if (-not $bon) {
      Write-Host "  ATTENTION : ce n'est PAS l'adresse attendue -" -ForegroundColor Red
      Write-Host ("              " + $URL_WEBHOOK) -ForegroundColor Red
    }
    Write-Host ("  Evenements : " + ($a.events -join ", "))
    Write-Host ("  Cree le    : " + $a.created_at)
    Write-Host "  (les reservations ANTERIEURES a cette date n'ont jamais ete envoyees)" -ForegroundColor Gray
  }
} catch {
  Write-Host "  Lecture impossible (permission webhooks:read absente du jeton ?)" -ForegroundColor Yellow
}

# --- 3. Les rendez-vous a venir -------------------------------
Write-Host ""
Write-Host "--- Rendez-vous a venir chez Calendly ---" -ForegroundColor Cyan
$depuis = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$urlEvts = "https://api.calendly.com/scheduled_events?user=" + $moi.uri + "`&min_start_time=" + $depuis + "`&status=active`&count=50"
$evenements = @()
try {
  $evenements = (Invoke-RestMethod -Uri $urlEvts -Headers $entetes).collection
} catch {
  Write-Host "  Lecture impossible (permission de planification absente ?)" -ForegroundColor Yellow
  exit 1
}

if (-not $evenements -or $evenements.Count -eq 0) {
  Write-Host "  Aucun rendez-vous a venir." -ForegroundColor Yellow
  Write-Host "  Si tes clientes ont reserve, leurs creneaux sont peut-etre deja passes."
  exit 0
}

Write-Host ("  " + $evenements.Count + " rendez-vous trouve(s) :") -ForegroundColor Green
foreach ($e in $evenements) {
  Write-Host ("   - " + $e.start_time + "  " + $e.name)
}

# --- 4. Rattrapage --------------------------------------------
Write-Host ""
$reponse = Read-Host "Les injecter dans ton cabinet ? (o/N)"
if ($reponse -ne "o" -and $reponse -ne "O") {
  Write-Host "Rien n'a ete injecte." -ForegroundColor Gray
  exit 0
}

$s2 = Read-Host "Cle de signature (la MEME que dans Railway)" -AsSecureString
$cle = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($s2))
if (-not $cle) { Write-Host "Cle vide - arret." -ForegroundColor Red; exit 1 }

$ok = 0
$echecs = 0

foreach ($e in $evenements) {
  # Les coordonnees de la cliente vivent sur l'invitation, pas sur
  # l'evenement : il faut une requete de plus par rendez-vous.
  try {
    $invites = (Invoke-RestMethod -Uri ($e.uri + "/invitees") -Headers $entetes).collection
  } catch { $invites = @() }

  foreach ($inv in $invites) {
    if ($inv.status -ne "active") { continue }

    # Meme forme que ce qu'envoie Calendly, pour que le serveur n'ait
    # aucun cas particulier a connaitre.
    $corpsObjet = @{
      event   = "invitee.created"
      payload = @{
        uri                   = $inv.uri
        name                  = $inv.name
        email                 = $inv.email
        created_at            = $inv.created_at
        text_reminder_number  = $inv.text_reminder_number
        questions_and_answers = $inv.questions_and_answers
        scheduled_event       = @{
          uri        = $e.uri
          name       = $e.name
          start_time = $e.start_time
          end_time   = $e.end_time
        }
        payment = $inv.payment
      }
    }

    $corps = $corpsObjet | ConvertTo-Json -Depth 10 -Compress
    $t = [int][double]::Parse((Get-Date -UFormat %s))

    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($cle)
    $signature = ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$t.$corps")) |
      ForEach-Object { $_.ToString("x2") }) -join ""

    try {
      Invoke-RestMethod -Method Post -Uri $URL_WEBHOOK `
        -Headers @{ "Calendly-Webhook-Signature" = "t=$t,v1=$signature"; "Content-Type" = "application/json" } `
        -Body $corps | Out-Null
      Write-Host ("   OK  " + $inv.name + "  " + $e.start_time) -ForegroundColor Green
      $ok++
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -eq 403) {
        Write-Host "   REFUSE : signature invalide." -ForegroundColor Red
        Write-Host "   => la cle saisie n'est PAS celle posee dans Railway." -ForegroundColor Red
        exit 1
      }
      Write-Host ("   ECHEC (" + $code + ") " + $inv.name) -ForegroundColor Red
      $echecs++
    }
  }
}

Write-Host ""
Write-Host ("Termine : " + $ok + " injecte(s), " + $echecs + " echec(s).") -ForegroundColor Cyan
if ($ok -gt 0) {
  Write-Host "Ouvre ton cabinet : les rendez-vous du jour doivent apparaitre."
  Write-Host "Et si l'injection a marche, ta cle de signature est la bonne."
}
