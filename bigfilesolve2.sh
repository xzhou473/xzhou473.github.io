mkdir -p public/research/webp
for f in public/research/*.png; do
  convert "$f" -strip -resize 1600x1600\> -quality 82 "public/research/webp/$(basename "${f%.png}.webp")"
done
grep -rl 'research/.*\.png' src | xargs sed -i '' 's/\.png/\.webp/g'

