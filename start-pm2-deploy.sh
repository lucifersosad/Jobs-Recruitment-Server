cd /home/ubuntu/Jobs-Recruitment-Server

echo "* Pulling code..."
git pull

echo "* Installing package..."
npm i

echo "* Building code..."
npm run build

pm2 start npm --name "api_utem" -- run "start:build"

pm2 save
