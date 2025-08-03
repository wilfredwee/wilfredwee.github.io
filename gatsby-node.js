const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ actions, graphql }) => {
  const { createPage } = actions
  const result = await graphql(`
    query {
      allMarkdownRemark(sort: { frontmatter: { date: ASC } }) {
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

  result.data.allMarkdownRemark.edges.forEach(
    ({
      node: {
        fields: { slug },
      },
    }) =>
      createPage({
        path: slug,
        component: require.resolve("./src/templates/blog-entry-template.js"),
        context: { slug },
      })
  )
}

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({
      node,
      getNode,
      basePath: `pages/posts`,
      trailingSlash: false,
    })

    const isDraft = getNode(node.parent).relativeDirectory !== "pages/posts"

    createNodeField({
      node,
      name: `slug`,
      value: `/entry${slug}`,
    })

    createNodeField({
      node,
      name: `isDraft`,
      value: isDraft,
    })
  }
}
