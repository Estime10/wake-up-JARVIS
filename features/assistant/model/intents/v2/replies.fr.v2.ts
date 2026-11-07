/**
 * Réponses FR v2 (gabarits) — GÉNÉRÉ par proposals/intents-v2/tools/generate.py (ne pas éditer à la main).
 * Même format que features/assistant/model/intents/*Phrases.ts (@03cf47e) : tableaux `as const`,
 * slots {label} {repo} {folder} {file} {n} + NOUVEAUX {account} {text} (à brancher dans SLOT_CAPTURE), max 2 par phrase.
 */

export type ReplyV2 = {
  readonly ok: string;
  readonly empty?: string;
  readonly error?: string;
  readonly ambiguous?: string;
  readonly active?: string;
  readonly forbidden?: string;
  readonly missing?: Readonly<Record<string, string>>;
};

export const REPLIES_FR_V2: Readonly<Record<string, ReplyV2>> = {
  help: {
    ok: "Je lis tes 3 boîtes mail (d'avant-hier à aujourd'hui), ton GitHub (repos, PR, commits, branches, fichiers) et ton dossier perso du Mac. J'ouvre les fichiers sans risque, je montre le reste dans le Finder et j'ouvre un terminal dans un dossier. Dis « aide mails », « aide GitHub » ou « aide fichiers ».",
  },
  "help.mail": {
    ok: "Mails : « mes mails », « mes mails non lus », « les mails d'aujourd'hui », « les mails de Paul », « mails du label Factures », « mails de ma boîte pro », « combien de mails », « montre-moi tout ». Je vois d'avant-hier à aujourd'hui, en lecture seule, sur tes 3 boîtes.",
  },
  "help.github": {
    ok: "GitHub : « mes repos », « PR de kozy », « PR fermées de kozy », « la PR 12 de kozy », « commits de kozy », « branches de kozy », « fichiers de kozy », « montre le README de kozy ». Lecture seule : je ne commit, push ni merge jamais.",
  },
  "help.files": {
    ok: "Fichiers : « cherche budget dans Documents », « qu'y a-t-il dans Téléchargements », « ouvre facture-mars.pdf », « montre budget.xlsx dans le Finder », « ouvre Projets dans le Finder », « ouvre un terminal dans code ». J'ouvre seulement les fichiers sans risque ; les autres, je les montre dans le Finder. Je n'écris rien et je ne lance aucune commande.",
  },
  "help.limits": {
    ok: "Je suis en lecture seule : je n'envoie, ne supprime, ne déplace et n'écris rien ; je ne lance aucune commande ; je ne touche ni à l'app Notes, ni à la corbeille, ni aux clés, mots de passe et fichiers .env ou .key.",
  },
  "system.status": {
    ok: "Mails : {mailState}. GitHub : {githubState}. Mac : {macState}.",
    error: "Je n'arrive pas à lire l'état des connexions pour l'instant.",
  },
  "system.privacy": {
    ok: "Je ne garde rien de tes mails : ni résumé, ni extrait. Tout est lu à la volée et affiché, puis oublié. Ta position reste dans le navigateur et je ne copie aucun secret.",
  },
  "system.access": {
    ok: "J'ai un accès en lecture : tes 3 boîtes Gmail, GitHub avec un jeton en lecture seule et ton dossier perso du Mac, sauf les fichiers sensibles (clés, mots de passe, .env, .key, Notes, corbeille).",
  },
  "chat.greeting": { ok: "Salut DevinChat. Mails, GitHub ou fichiers ?" },
  "chat.how_are_you": { ok: "Tout roule, DevinChat. Je t'écoute." },
  "chat.thanks": { ok: "Avec plaisir, DevinChat." },
  "chat.goodbye": { ok: "À plus, DevinChat." },
  "chat.identity": {
    ok: "Je suis E.L.S.A., ton assistant en lecture seule pour tes mails, ton GitHub et les fichiers de ton Mac.",
  },
  "chat.compliment": { ok: "Merci DevinChat, ça fait plaisir." },
  "chat.frustration": {
    ok: "Compris, DevinChat. Dis-moi ce qui n'a pas marché, ou dis « aide ».",
  },
  "chat.apology": { ok: "Pas de souci, DevinChat." },
  "chat.laugh": { ok: "Content que ça te fasse rire, DevinChat." },
  "chat.personal": {
    ok: "Je suis un assistant, DevinChat : pas de vie perso, mais toujours là pour tes mails, GitHub et fichiers.",
  },
  "conv.cancel": { ok: "C'est annulé.", empty: "Rien en cours à annuler." },
  "conv.repeat": {
    ok: "{lastReply}",
    empty: "Je n'ai encore rien dit, DevinChat.",
  },
  "conv.confirm": {
    ok: "C'est parti.",
    empty: "Rien à confirmer, DevinChat. Qu'est-ce que tu veux voir ?",
  },
  "conv.deny": { ok: "D'accord, je ne fais rien.", empty: "D'accord." },
  "conv.correct": {
    ok: "(réanalyse de « {text} »)",
    missing: { text: "D'accord. Qu'est-ce que tu voulais dire ?" },
  },
  "conv.more": { ok: "Voici la suite.", empty: "Il n'y a rien de plus." },
  "conv.wait": { ok: "Je t'écoute, DevinChat." },
  "conv.select": {
    ok: "J'ouvre le numéro {n}.",
    empty: "Il n'y a pas de liste à choisir, DevinChat.",
    error: "Il n'y a pas de numéro {n} dans la liste.",
    missing: { n: "Lequel ? Donne-moi le numéro." },
  },
  "conv.compound": {
    ok: "Une chose à la fois, DevinChat : je fais « {first} ». Redis-moi la suite après.",
  },
  "time.now": { ok: "Il est {time}." },
  "time.date": { ok: "Nous sommes le {date}." },
  "geo.where": {
    ok: "Tu es vers {place}.",
    empty:
      "Je n'ai pas ta position : autorise la localisation dans le navigateur.",
    error: "Je n'arrive pas à lire ta position pour l'instant.",
  },
  "ui.phrase_catalog": { ok: "Je t'ouvre la liste des phrases." },
  "ui.panel_mail": { ok: "J'affiche le panneau des mails." },
  "ui.panel_repos": {
    ok: "J'affiche le panneau Dépôts sur {repo}.",
    empty: "J'affiche le panneau Dépôts.",
    error:
      "Je ne trouve pas de repo « {repo} ». Dis « mes repos » pour la liste.",
  },
  "ui.repo_tab_pr": {
    ok: "J'ouvre l'onglet PR de {repo}.",
    empty: "J'ouvre l'onglet PR.",
    missing: { repo: "L'onglet PR de quel repo ?" },
    error: "Je ne trouve pas de repo « {repo} ».",
  },
  "ui.repo_tab_commits": {
    ok: "J'ouvre l'onglet Commits de {repo}.",
    empty: "J'ouvre l'onglet Commits.",
    missing: { repo: "L'onglet Commits de quel repo ?" },
    error: "Je ne trouve pas de repo « {repo} ».",
  },
  "ui.repo_tab_files": {
    ok: "J'ouvre l'onglet Fichiers de {repo}.",
    empty: "J'ouvre l'onglet Fichiers.",
    missing: { repo: "L'onglet Fichiers de quel repo ?" },
    error: "Je ne trouve pas de repo « {repo} ».",
  },
  "ui.repo_tab_branches": {
    ok: "J'ouvre l'onglet Branches de {repo}.",
    empty: "J'ouvre l'onglet Branches.",
    missing: { repo: "L'onglet Branches de quel repo ?" },
    error: "Je ne trouve pas de repo « {repo} ».",
  },
  "ui.close_panel": { ok: "C'est fermé.", empty: "Aucun panneau ouvert." },
  "ui.stop_speaking": { ok: "", empty: "" },
  "ui.mute": { ok: "Voix coupée. Je réponds en texte." },
  "ui.unmute": { ok: "Voix réactivée." },
  "mail.recent": {
    ok: "Voici tes {n} derniers mails.",
    empty: "Aucun mail reçu d'avant-hier à aujourd'hui.",
    error:
      "Je n'arrive pas à lire tes mails pour l'instant. Réessaie dans un moment.",
  },
  "mail.unread": {
    ok: "Tu as {count} mails non lus. Les voici.",
    empty: "Aucun mail non lu d'avant-hier à aujourd'hui. Tranquille.",
  },
  "mail.today": {
    ok: "Aujourd'hui, tu as reçu {count} mails. Les voici.",
    empty: "Aucun mail reçu aujourd'hui pour l'instant.",
  },
  "mail.yesterday": {
    ok: "Hier, tu as reçu {count} mails. Les voici.",
    empty: "Aucun mail reçu hier.",
  },
  "mail.out_of_window": {
    ok: "Je ne vois que tes mails d'avant-hier à aujourd'hui, DevinChat. Pour plus ancien, ouvre Gmail directement.",
  },
  "mail.overview": {
    ok: "Voici le résumé de tes mails {window} : {summary}",
    empty: "Rien dans tes boîtes d'avant-hier à aujourd'hui.",
  },
  "mail.count": {
    ok: "Tu as {count} mails d'avant-hier à aujourd'hui.",
    empty: "Aucun mail d'avant-hier à aujourd'hui.",
  },
  "mail.count_unread": {
    ok: "Tu as {count} mails non lus.",
    empty: "Zéro non lu. Boîte propre.",
  },
  "mail.count_flagged": {
    ok: "Tu as {count} mails importants.",
    empty: "Aucun mail important en ce moment.",
  },
  "mail.count_today": {
    ok: "Tu as reçu {count} mails aujourd'hui.",
    empty: "Aucun mail reçu aujourd'hui.",
  },
  "mail.count_label": {
    ok: "Tu as {count} mails dans « {label} ».",
    empty: "Aucun mail dans « {label} » en ce moment.",
    error: "Je ne trouve pas de label « {label} ».",
    missing: { label: "Dans quel label ?" },
  },
  "mail.label": {
    ok: "Voici les mails « {label} ».",
    empty: "Aucun mail « {label} » d'avant-hier à aujourd'hui.",
    error:
      "Je ne trouve pas de label « {label} ». Dis « mes labels » pour la liste.",
    missing: { label: "Quel label ? Par exemple Factures ou Newsletters." },
  },
  "mail.labels": {
    ok: "Tes labels : {list}.",
    empty: "Je ne vois aucun label sur tes mails récents.",
  },
  "mail.sent": {
    ok: "Voici tes derniers mails envoyés.",
    empty: "Aucun mail envoyé d'avant-hier à aujourd'hui.",
  },
  "mail.sent_by_label": {
    ok: "Voici ce que tu as envoyé dans « {label} ».",
    empty: "Rien envoyé dans « {label} » d'avant-hier à aujourd'hui.",
    missing: { label: "Dans quel label ?" },
  },
  "mail.flagged": {
    ok: "Voici tes mails importants.",
    empty: "Aucun mail important d'avant-hier à aujourd'hui.",
  },
  "mail.accounts": {
    ok: "Je lis {count} boîtes : {list}.",
    empty: "Aucune boîte mail connectée.",
  },
  "mail.account": {
    ok: "Voici les mails de ta boîte {account}.",
    empty: "Aucun mail dans ta boîte {account} d'avant-hier à aujourd'hui.",
    error: "Je ne connais pas de boîte « {account} ». Dis « mes boîtes mail ».",
    missing: {
      account: "Quelle boîte ? Dis « mes boîtes mail » pour la liste.",
    },
  },
  "mail.unread_account": {
    ok: "Voici les non lus de ta boîte {account}.",
    empty: "Aucun non lu dans ta boîte {account}.",
    missing: { account: "Quelle boîte ?" },
  },
  "mail.from": {
    ok: "Voici les mails de {text}.",
    empty: "Aucun mail de {text} d'avant-hier à aujourd'hui.",
    missing: { text: "De qui ?" },
  },
  "mail.search": {
    ok: "J'ai trouvé {count} mails qui parlent de « {text} ».",
    empty: "Aucun mail ne parle de « {text} » d'avant-hier à aujourd'hui.",
    missing: { text: "Je cherche quoi dans tes mails ?" },
  },
  "mail.attachments": {
    ok: "Voici les mails avec une pièce jointe.",
    empty: "Aucun mail avec pièce jointe d'avant-hier à aujourd'hui.",
  },
  "mail.read": {
    ok: "Mail {n} : de {from}, « {subject} », reçu à {time}.",
    empty: "Il n'y a pas de mail numéro {n}.",
    missing: { n: "Lequel ? Dis par exemple « lis le mail 2 »." },
  },
  "mail.summary": {
    ok: "En bref, le mail {n} : {summary}",
    empty: "Il n'y a pas de mail numéro {n}.",
    missing: { n: "Quel mail ? Dis par exemple « résume le mail 1 »." },
  },
  "github.status": {
    ok: "GitHub connecté en tant que {login}, en lecture seule.",
    empty: "GitHub n'est pas connecté. Branche-le dans les réglages.",
    error: "Le jeton GitHub doit être renouvelé (accès refusé).",
  },
  "github.repos": {
    ok: "Tu as {count} repos. Les plus récents : {list}.",
    empty: "Aucun repo visible avec ce jeton.",
    error: "Je n'arrive pas à lire tes repos GitHub pour l'instant.",
  },
  "github.repo_info": {
    ok: "{repo} : {description}. Langage {language}, mis à jour {updated}.",
    error: "Je ne trouve pas de repo « {repo} ».",
    missing: { repo: "Sur quel repo ? Dis « mes repos » pour la liste." },
  },
  "github.prs": {
    ok: "Voici {count} PR ouvertes sur {repo}.",
    empty: "Aucune PR ouverte sur {repo}.",
    missing: {
      repo: "Toutes repos confondues, voici tes {count} PR ouvertes.",
    },
    error: "Je ne trouve pas de repo « {repo} ».",
  },
  "github.prs_closed": {
    ok: "Voici les dernières PR fermées ou mergées sur {repo}.",
    empty: "Aucune PR fermée récemment sur {repo}.",
    missing: { repo: "Sur quel repo ? Dis « mes repos » pour la liste." },
    error: "Je ne trouve pas de repo « {repo} ».",
  },
  "github.pr_detail": {
    ok: "PR {n} sur {repo} : « {title} » par {author}, {state}.",
    empty: "Je ne trouve pas de PR {n} sur {repo}.",
    missing: { repo: "La PR {n} de quel repo ?", n: "Quel numéro de PR ?" },
  },
  "github.issues": {
    ok: "Voici {count} issues ouvertes sur {repo}.",
    empty: "Aucune issue ouverte sur {repo}.",
    missing: { repo: "Sur quel repo ? Dis « mes repos » pour la liste." },
    error: "Je n'ai pas accès aux issues de {repo} avec ce jeton.",
  },
  "github.issue_detail": {
    ok: "Issue {n} sur {repo} : « {title} », {state}.",
    empty: "Je ne trouve pas d'issue {n} sur {repo}.",
    missing: { repo: "L'issue {n} de quel repo ?", n: "Quel numéro d'issue ?" },
  },
  "github.commits": {
    ok: "Voici les derniers commits de {repo}.",
    empty: "Aucun commit sur {repo}.",
    missing: { repo: "Sur quel repo ? Dis « mes repos » pour la liste." },
    error: "Je ne trouve pas de repo « {repo} ».",
  },
  "github.commit_last": {
    ok: "Dernier commit sur {repo} : « {message} » par {author}, {when}.",
    empty: "Aucun commit sur {repo}.",
    missing: { repo: "Sur quel repo ? Dis « mes repos » pour la liste." },
  },
  "github.branches": {
    ok: "Voici les branches de {repo}.",
    empty: "Aucune branche sur {repo}.",
    missing: { repo: "Sur quel repo ? Dis « mes repos » pour la liste." },
    error: "Je ne trouve pas de repo « {repo} ».",
  },
  "github.current_branch": {
    ok: "Je lis GitHub à distance, pas ton dépôt local : je ne peux pas savoir sur quelle branche tu es. Ouvre un terminal dans le dossier et regarde-le toi-même, ou dis « branches de kozy ».",
  },
  "github.files": {
    ok: "Voici les fichiers de {repo}.",
    empty: "Le repo {repo} est vide.",
    missing: { repo: "Sur quel repo ? Dis « mes repos » pour la liste." },
  },
  "github.file_preview": {
    ok: "Voici {file} de {repo}, en texte brut.",
    empty: "Je ne trouve pas « {file} » dans {repo}.",
    missing: {
      repo: "Le fichier {file} de quel repo ?",
      file: "Quel fichier de {repo} ?",
    },
    forbidden: "Je n'affiche pas ce fichier : il peut contenir des secrets.",
  },
  "github.activity": {
    ok: "Les repos qui ont bougé récemment : {list}.",
    empty: "Rien de neuf sur GitHub récemment.",
  },
  "files.list": {
    ok: "Dans {folder}, il y a {count} éléments : {list}.",
    empty: "Le dossier {folder} est vide.",
    error: "Je ne trouve pas de dossier « {folder} » dans ton dossier perso.",
    missing: {
      folder: "Quel dossier ? Par exemple Documents ou Téléchargements.",
    },
    forbidden: "Cet emplacement est protégé, je n'y touche pas.",
  },
  "files.reveal_folder": {
    ok: "J'ouvre {folder} dans le Finder.",
    error: "Je ne trouve pas de dossier « {folder} ».",
    missing: { folder: "Quel dossier ?" },
    forbidden: "Cet emplacement est protégé, je n'y touche pas.",
  },
  "files.home": { ok: "J'ouvre ton dossier perso dans le Finder." },
  "files.find": {
    ok: "J'ai trouvé {count} résultats pour « {file} » : {list}.",
    empty: "Rien trouvé pour « {file} »{inFolder}.",
    missing: { file: "Je cherche quoi ?" },
    forbidden: "Je ne cherche pas ce genre de fichier : il est protégé.",
  },
  "files.open": {
    ok: "J'ouvre {file}.",
    empty: "Je ne trouve pas « {file} ». Dis « cherche {file} » pour élargir.",
    ambiguous: "J'ai {count} fichiers « {file} ». Lequel ? Dis le numéro.",
    active:
      "{file} peut lancer un programme : je te le montre dans le Finder sans l'ouvrir.",
    missing: { file: "J'ouvre quel fichier ?" },
    forbidden: "Je n'ouvre pas ce fichier : il est protégé.",
  },
  "files.reveal_file": {
    ok: "Je te montre {file} dans le Finder.",
    empty: "Je ne trouve pas « {file} ».",
    missing: { file: "Quel fichier ?" },
    forbidden: "Je ne montre pas ce fichier : il est protégé.",
  },
  "files.recent": {
    ok: "Tes derniers fichiers{inFolder} : {list}.",
    empty: "Aucun fichier récent{inFolder}.",
  },
  "terminal.open": {
    ok: "J'ouvre un terminal dans {folder}. Je n'y tape rien.",
    empty: "J'ouvre un terminal dans ton dossier perso. Je n'y tape rien.",
    error: "Je ne trouve pas de dossier « {folder} ».",
    forbidden: "Cet emplacement est protégé, je n'y touche pas.",
  },
  "app.unsupported": {
    ok: "Je n'ouvre que le Finder, le Terminal et tes fichiers dans leur app. Pour {text}, ouvre-le toi-même.",
    missing: { text: "Je n'ouvre que le Finder et le Terminal." },
  },
  "refuse.delete": {
    ok: "Je ne supprime rien, DevinChat : je suis en lecture seule. Fais-le toi-même dans le Finder ou dans l'app concernée.",
  },
  "refuse.write_file": {
    ok: "Je ne crée, ne modifie, ne renomme, ne déplace et ne copie aucun fichier : je suis en lecture seule.",
  },
  "refuse.mail_write": {
    ok: "Je n'envoie, ne réponds, ne transfère et n'archive aucun mail : je les lis seulement. Fais-le dans Gmail.",
  },
  "refuse.git_write": {
    ok: "Je ne fais ni commit, ni push, ni merge, ni rien qui modifie GitHub : mon jeton est en lecture seule.",
  },
  "refuse.execute": {
    ok: "Je ne lance aucune commande. Je peux t'ouvrir un terminal dans un dossier, et c'est toi qui tapes.",
  },
  "refuse.notes": {
    ok: "L'app Notes m'est interdite, DevinChat. Je n'y touche pas.",
  },
  "refuse.trash": {
    ok: "La corbeille m'est interdite : je ne la lis pas et je ne la vide pas.",
  },
  "refuse.secrets": {
    ok: "Je ne montre ni clés, ni mots de passe, ni jetons, ni fichiers .env ou .key. Ils restent masqués.",
  },
  "refuse.system": {
    ok: "Je ne change aucun réglage du Mac : ni veille, ni réseau, ni son, ni redémarrage.",
  },
  "refuse.weather": {
    ok: "Je n'ai pas de météo, DevinChat : aucune source n'est branchée.",
  },
  "refuse.web": {
    ok: "Je ne navigue pas sur internet. Je lis seulement tes mails, GitHub et tes fichiers.",
  },
  "refuse.messaging": {
    ok: "Je n'envoie aucun message et je n'appelle personne : ni SMS, ni WhatsApp, ni Slack.",
  },
  "refuse.calendar": {
    ok: "Je n'ai pas accès à ton agenda et je ne crée ni rappel ni alarme.",
  },
  "refuse.share": { ok: "Je ne partage et ne publie rien, DevinChat." },
  "refuse.other_people": {
    ok: "Je ne lis que tes 3 boîtes et ton GitHub. Les comptes et la position des autres, non.",
  },
  "refuse.jailbreak": {
    ok: "Non, DevinChat : mes règles de sécurité ne se désactivent pas à la voix.",
  },
  "refuse.out_of_scope": {
    ok: "Ça sort de mon périmètre, DevinChat : mails, GitHub et fichiers, en lecture. Dis « aide ».",
  },
};

export const FALLBACK_UNKNOWN_V2 =
  "Je n'ai pas compris, DevinChat. Dis « aide » pour voir ce que je sais faire.";
