export const jabberwocky = {
    init: function(container: HTMLElement): HTMLElement {
        const title = document.createElement('h1');
        title.appendChild(document.createTextNode('Jabberwocky'));
        const subtitle = document.createElement('h3');

        const anchorA = document.createElement('a');
        anchorA.setAttribute('href', 'https://en.wikipedia.org/wiki/Jabberwocky');
        anchorA.setAttribute('target', '_blank');
        anchorA.appendChild(document.createTextNode('by '));
        subtitle.appendChild(anchorA);
        const anchorB = document.createElement('a');
        anchorB.setAttribute('href', 'https://en.wikipedia.org/wiki/Jabberwocky');
        anchorB.appendChild(document.createTextNode('Lewis'));
        subtitle.appendChild(anchorB);
        const anchorC = document.createElement('a');
        anchorC.setAttribute('href', 'https://en.wikipedia.org/wiki/Lewis_Carroll');
        anchorC.appendChild(document.createTextNode(' Carroll'));
        subtitle.appendChild(anchorC);

        const p = document.createElement('p');
        const i = document.createElement('i');
        p.appendChild(i);
        const content = getContent();
        content.split('\n').forEach(line => {
            const textNode = document.createTextNode(line);
            const br = document.createElement('br');
            i.appendChild(textNode);
            i.appendChild(br);
        });

        container.style.textAlign = 'center';
        container.appendChild(title);
        container.appendChild(subtitle);
        container.appendChild(p);

        return container;
    },

    read: function(): string {
        return getContent();
    },
};

function getContent(): string {
    return `’Twas brillig, and the slithy toves
            Did gyre and gimble in the wabe:
            All mimsy were the borogoves,
            And the mome raths outgrabe.

            “Beware the Jabberwock, my son!
            The jaws that bite, the claws that catch!
            Beware the Jubjub bird, and shun
            The frumious Bandersnatch!”

            He took his vorpal sword in hand;
            Long time the manxome foe he sought—
            So rested he by the Tumtum tree
            And stood awhile in thought.

            And, as in uffish thought he stood,
            The Jabberwock, with eyes of flame,
            Came whiffling through the tulgey wood,
            And burbled as it came!

            One, two! One, two! And through and through
            The vorpal blade went snicker-snack!
            He left it dead, and with its head
            He went galumphing back.

            “And hast thou slain the Jabberwock?
            Come to my arms, my beamish boy!
            O frabjous day! Callooh! Callay!”
            He chortled in his joy.

            ’Twas brillig, and the slithy toves
            Did gyre and gimble in the wabe:
            All mimsy were the borogoves,
            And the mome raths outgrabe.`;
}
