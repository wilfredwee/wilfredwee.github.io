const { createFilePath } = require(`gatsby-source-filesystem`);

exports.createPages = async ({ actions, graphql }) => {
  const { createPage } = actions;
  const result = await graphql(`
    query {
      allMarkdownRemark {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
    }
  `)

  // TODO: Replace this with real data.
  const blogPages = [
    {
      name: "blog-page-1",
      title: "Blog Page 1"
    },
    {
      name: "blog-page-2",
      title: "Blog Page 2"
    }
  ];

  result.data.allMarkdownRemark.edges.forEach(({ node: { fields: { slug } } }) => createPage({
    path: `/entry${slug}`,
    component: require.resolve('./src/templates/blog-entry-template.js'),
    context: { slug }
  }))
};

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages`, trailingSlash: false });
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}
