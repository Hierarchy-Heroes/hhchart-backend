
const assert = require('assert');
const smallds = require('./sampleData/small.json');
const cycloneAviationData = require('./sampleData/cycloneAviation.json');
const { createTree } = require('../treeConstruction');

const verifyTree = (node) => {
    if (!node) { return true; }

    if (node.children.length == 0) { return true; }

    node.children.forEach(child => {
        // tree substructure violated 
        if (child.managerId !== node.employeeId) {
            return false;
        }
        verifyTree(child);
    });
    return true;
}

describe('Simple Tree Construction', () => {
    const smallTree = createTree(smallds),
        smallTreeRoot = smallTree[0];
    it('small tree constructed correctly', () => {
        assert(verifyTree(smallTreeRoot), true);
    });
    it('CEO is root', () => {
        assert(smallTreeRoot.positionTitle === "CEO");
    });
});



describe('Given Data Construction', () => {
    const cycloneAviationTree = createTree(cycloneAviationData),
        cycloneAviationRoot = cycloneAviationTree[0];

    it('large tree constructed correctly', () => {
        assert(verifyTree(cycloneAviationRoot), true);
    });
    it('CEO is root', () => {
        assert(cycloneAviationRoot.positionTitle === "CEO");
    });
});

// TODO: more extensive testing to make sure that tree is being constructed correctly
