attempt_counter=0
max_attempts=100

until $(curl -m 1 --output /dev/null --silent --head --fail http://localhost:8443/ping); do
  if [ ${attempt_counter} -eq ${max_attempts} ];then
    echo ""
    echo "Max attempts reached to $1"
    exit 1
  fi

  printf '.'
  attempt_counter=$(($attempt_counter+1))
  sleep 5
done

until $(curl -m 1 --output /dev/null --silent --head --fail http://localhost:7443/ping); do
  if [ ${attempt_counter} -eq ${max_attempts} ];then
    echo ""
    echo "Max attempts reached to $1"
    exit 1
  fi

  printf '.'
  attempt_counter=$(($attempt_counter+1))
  sleep 5
done
