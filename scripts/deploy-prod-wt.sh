#!/usr/bin/env bash
set -euo pipefail

# 1) build
npm run build

# 2) fetch & remove ancienne worktree si besoin
git fetch origin
if git worktree list | grep -q "prod$"; then
  git worktree remove --force prod
fi

# 3) ajouter la branche prod dans ./prod
git worktree add --checkout prod production

# 4) nettoyer ./prod sauf .git et .gitignore (au cas où)
pushd prod >/dev/null
  # active extglob pour pouvoir exclure les fichiers particuliers
  shopt -s extglob
  # supprime tout sauf .git et .gitignore
  rm -rf -- !(.git|.gitignore)
  shopt -u extglob
popd >/dev/null

# 5) copier le build
cp -R dist/* prod/

# 6) commit & push depuis ./prod
pushd prod >/dev/null
  git add --all
  git commit -m "chore: deploy prod $(date +'%Y-%m-%d %H:%M:%S')"
  git push origin production --force
popd >/dev/null

# 7) on peut enlever la worktree
git worktree remove --force prod

echo "✓ Déploiement sur production terminé."

