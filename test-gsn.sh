ganache_url="http://localhost:8546"
relayer_port=8099
relayer_url="http://localhost:${relayer_port}"
relay_hub_addr="0xD216153c06E857cD7f72665E0aF1d7D82172F494"

relayer_running() {
  nc -z localhost "$relayer_port"
}

setup_gsn_relay() {
  echo "Launching GSN relay server to hub $relay_hub_addr"

  ./bin/gsn-relay -DevMode -RelayHubAddress $relay_hub_addr -EthereumNodeUrl $ganache_url -Url $relayer_url &> /dev/null &
  gsn_relay_server_pid=$!

  while ! relayer_running; do
    sleep 0.1
  done
  echo "GSN relay server launched!"

  npx @openzeppelin/gsn-helpers register-relayer --ethereumNodeURL $ganache_url --relayUrl $relayer_url
}

setup_gsn_relay
