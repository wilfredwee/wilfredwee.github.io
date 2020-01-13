import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

const IndexPage = ({ data }) => {
  const {
    allMarkdownRemark: { edges: posts },
  } = data

  return (
    <Layout>
      <SEO title="Home" />
      <h1>Front Page</h1>
      <p>Website is still under development. Slow progress.</p>
      <p>
        I'll be focusing more on writing content, and finishing my current
        project.
      </p>
      {posts.map(
        ({
          node: {
            fields: { slug },
            frontmatter: { date, title },
          },
        }) => {
          return (
            <ul>
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
    allMarkdownRemark {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
            date
          }
        }
      }
    }
  }
`

export default IndexPage
