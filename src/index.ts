import { Servient, Helpers } from "@node-wot/core";
import { HttpClientFactory } from "@node-wot/binding-http";
import { CoapClientFactory } from "@node-wot/binding-coap";
import axios from "axios";

class ThingConfiguration {
  protocol = "";
  address = "";
  ipv6 = true;

  constructor(protocol: string, address: string, ipv6: boolean) {
    this.protocol = protocol;
    this.address = address;
    this.ipv6 = ipv6;
  }
}

const repoName = "angular/angular";
const textTime = 5000;
const numberTime = 20000;
const thingConfig: ThingConfiguration = new ThingConfiguration(
  "http://",
  "192.168.178.28",
  false
);

const servient = new Servient();
if (thingConfig.protocol == "http://") {
  servient.addClientFactory(new HttpClientFactory());
} else if (thingConfig.protocol == "coap://") {
  servient.addClientFactory(new CoapClientFactory());
}

const wotHelper = new Helpers(servient);

function numberToString(number: number): string {
  let string = "";
  if (number < 99999) {
    string = number.toString();
  }
  if (number > 99999 && number < 1000000) {
    string = `${Math.trunc(number / 1000)} k`;
  }

  return string;
}

interface GithubRepository {
  stargazers_count: number;
  forks: number;
}

interface DisplayResponse {
  status: string;
}

interface ActionResponse {
  display: DisplayResponse;
}

async function getTimeoutPromise(
  data: [WoT.ConsumedThing, GithubRepository],
  timeout: number
): Promise<[WoT.ConsumedThing, GithubRepository]> {
  return await new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, timeout);
  });
}

async function consumeThing([repo, td, wot]: [
  GithubRepository,
  WoT.ThingDescription,
  WoT.WoT
]): Promise<[WoT.ConsumedThing, GithubRepository]> {
  return [await wot.consume(td), repo];
}

function setDisplayTo(thing: WoT.ConsumedThing, text: string) {
  const result: Promise<ActionResponse> = thing.invokeAction("display", {
    body: text,
  }) as Promise<ActionResponse>;

  result
    .then((result) => {
      if (result.display.status == "created") {
        console.log(`Showing ${text} was successful`);
      } else {
        console.warn(`Showing ${text} has failed`);
      }
    })
    .catch((err) => {
      console.error("setDisplay error:", err);
    });
}

const thingAddress: string = thingConfig.ipv6
  ? `[${thingConfig.address}]`
  : thingConfig.address;
const responses = Promise.all([
  axios
    .get(`https://api.github.com/repos/${repoName}`)
    .then((res) => res.data as GithubRepository),
  wotHelper.fetch(
    `${thingConfig.protocol}${thingAddress}/.well-known/wot-thing-description`
  ),
  servient.start(),
]);

const consumeThingResponse = responses.then(consumeThing);

consumeThingResponse.catch((err) => {
  console.error("Consumed Thing error:", err);
});

consumeThingResponse
  .then(async ([thing, repo]) => {
    setDisplayTo(thing, "Github");
    return getTimeoutPromise([thing, repo], textTime);
  })
  .then(async ([thing, repo]) => {
    setDisplayTo(thing, "stars");
    return getTimeoutPromise([thing, repo], textTime);
  })
  .then(async ([thing, repo]) => {
    setDisplayTo(thing, numberToString(repo.stargazers_count));
    return getTimeoutPromise([thing, repo], numberTime);
  })
  .then(async ([thing, repo]) => {
    setDisplayTo(thing, "forks");
    return getTimeoutPromise([thing, repo], textTime);
  })
  .then(async ([thing, repo]) => {
    setDisplayTo(thing, numberToString(repo.forks));
    return getTimeoutPromise([thing, repo], numberTime);
  })
  .catch((err) => {
    console.error("Fetch error:", err);
  });
