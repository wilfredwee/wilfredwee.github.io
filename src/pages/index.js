import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

const IndexPage = ({ data }) => {
  const {
    allMarkdownRemark: { edges: posts },
  } = data

  const filteredPosts = posts.filter(post => {
    return !post.node.frontmatter.disablePublish;
  });

  return (
    <Layout>
      <h1>Welcome</h1>
      <p>Website is still under development. Slow progress.</p>
      <p>
        I'll be focusing more on writing content, and finishing my current
        project.
      </p>
      {filteredPosts.map(
        ({
          node: {
            fields: { slug },
            frontmatter: { date, title },
          },
        }) => {
          return (
            <ul key={slug}>
              <Link to={slug}>{`${date}: ${title}`}</Link>
            </ul>
          )
        }
      )}
    </Layout>
  )
}

export const query = graphql`
  query {
    allMarkdownRemark(filter: { fields: { isDraft: { eq: false } } }) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
            date
            disablePublish
            tags
          }
        }
      }
    }
  }
`

export const Head = () => <SEO title="Home" />

export default IndexPage
