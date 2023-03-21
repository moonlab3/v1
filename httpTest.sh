id=$1
user=$2
c=1
while [ 1 ]
do
  rand="$(($RANDOM%5+1))"
secs=$SECONDS
#curl -X POST https://127.0.0.1:3001/v1/hscan -d '{"id": "'"$id""$secs"'", "pass":'"$secs"'}' -H "Content-Type: application/json"
#echo ""
#sleep 1
curl -k -X GET https://127.0.0.1:3001/v1/hscan/"$rand"/user/"$rand$rand"  -H "Content-Type: application/json"
echo ""
sleep .3

done

