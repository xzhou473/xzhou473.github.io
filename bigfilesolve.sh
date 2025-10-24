# add/ensure ignores
cat >> .gitignore <<'EOF'
dist/
node_modules/
.DS_Store
EOF

# untrack already-committed build artifacts
git rm -r --cached dist node_modules 2>/dev/null || true
git add .gitignore
git commit -m "Ignore build artifacts (dist/, node_modules)"

