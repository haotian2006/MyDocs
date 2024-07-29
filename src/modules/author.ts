interface AuthorData {
    username: string;
    pfp: string;
    url?: string;
}

const discordCache = new Map<string, AuthorData | null>();
const githubCache = new Map<string, AuthorData | null>();

const getDiscordData = async (userID: string) => {
    if (discordCache.has(userID)) {
        return discordCache.get(userID) as { username: string; pfp: string } | null;
    }

    const response = await fetch(`https://discord.com/api/v9/users/${userID}`, {
        headers: {
            Authorization: `Bot ${import.meta.env.DISCORD_API_TOKEN}`,
        },
    });

    const data = await response.json();
    const username = data.username;
    const pfp = `https://cdn.discordapp.com/avatars/${userID}/${data.avatar}.png`;

    if (data.Id) {
        discordCache.set(userID, null);
        return null;
    }

    discordCache.set(userID, { username: username, pfp: pfp });

    return { username: username, pfp: pfp };
};

const getGitHubData = async (userID: string) => {
    if (githubCache.has(userID)) {
        return githubCache.get(userID) as { username: string; pfp: string } | null;
    }
    const response = await fetch(`https://api.github.com/user/${userID}`, {
        headers: {
            Authorization: `token ${import.meta.env.GITHUB_API_TOKEN}`,
        },
    });
    const data = await response.json();
    const username = data.login;
    const pfp = data.avatar_url;

    if (data.Id) {
        githubCache.set(userID, null);
        return null;
    }
    githubCache.set(userID, { username: username, pfp: pfp, url: data.html_url });

    return { username: username, pfp: pfp, url: data.html_url };
};

function getPlatform(author: string): ["discord" | "github" | null, string] {
    if (author.startsWith("discord:")) {
        const userID = author.split(":")[1].trim();
        return ["discord", userID];
    } else if (author.startsWith("github:")) {
        const userID = author.split(":")[1].trim();

        return ["github", userID];
    } else {
        return [null, author];
    }
}

export async function getAuthorData(
    author: string | undefined,
): Promise<{ username: string; pfp: string; url?: string } | null> {
    if (!author) {
        return null;
    }
    const [platform, userID] = getPlatform(author);

    if (platform === "discord") {
        return await getDiscordData(userID);
    } else if (platform === "github") {
        return await getGitHubData(userID);
    } else {
        return {
            username: author,
            pfp: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
        };
    }
}
