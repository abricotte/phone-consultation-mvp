// Fabrique l'empreinte d'un nouveau mot de passe, a coller dans Supabase.
//
// Les mots de passe ne sont enregistres nulle part : la base ne contient
// que des empreintes bcrypt, un calcul a sens unique. On ne peut donc pas
// retrouver un mot de passe perdu — seulement en poser un nouveau.
//
// Le mot de passe est demande au clavier et N'EST PAS AFFICHE. Il ne
// transite ni par un fichier, ni par l'historique du terminal, ni par la
// conversation avec l'assistant. Seule l'empreinte s'affiche, et elle est
// inutilisable pour se connecter.
//
// Usage :  node scripts/nouveau-mot-de-passe.js

const bcrypt = require('../backend/node_modules/bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Masque la frappe : sans cela le mot de passe resterait lisible a
// l'ecran et dans l'historique de la console.
function demanderMasque(question) {
  return new Promise((resolve) => {
    const surEcriture = (chaine) => {
      if (rl.stdoutMuted && chaine !== '\r\n' && chaine !== '\n') {
        rl.output.write('*');
      } else {
        rl.output.write(chaine);
      }
    };
    const ecrireOriginal = rl._writeToOutput;
    rl._writeToOutput = surEcriture;
    rl.stdoutMuted = false;
    rl.question(question, (reponse) => {
      rl.stdoutMuted = false;
      rl._writeToOutput = ecrireOriginal;
      rl.output.write('\n');
      resolve(reponse);
    });
    rl.stdoutMuted = true;
  });
}

(async () => {
  console.log('\n=== Nouveau mot de passe ===\n');

  const mdp = await demanderMasque('Mot de passe souhaite (8 caracteres minimum) : ');
  if (!mdp || mdp.length < 8) {
    console.log('\nTrop court — rien n\'a ete genere.');
    rl.close();
    process.exit(1);
  }

  const confirmation = await demanderMasque('Repetez-le pour confirmer : ');
  if (mdp !== confirmation) {
    console.log('\nLes deux saisies different — rien n\'a ete genere.');
    rl.close();
    process.exit(1);
  }

  const empreinte = await bcrypt.hash(mdp, 10);

  console.log('\nEmpreinte a coller dans Supabase :\n');
  console.log('  ' + empreinte);
  console.log('\nRequete SQL — remplacez l\'adresse email :\n');
  console.log("  UPDATE users SET password_hash = '" + empreinte + "'");
  console.log("   WHERE email = 'VOTRE_EMAIL_ICI';\n");
  console.log('Cette empreinte ne permet pas de se connecter : elle ne sert');
  console.log('qu\'a verifier le mot de passe que vous venez de choisir.\n');

  rl.close();
})();
