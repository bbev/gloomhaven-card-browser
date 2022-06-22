import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import InfiniteScroll from "react-infinite-scroller";

import { search } from "./api/search";
import { baseUrl, baseCharacters, colour, optionToLabel } from "../data/common";
import { useSpoilers } from "../hooks/useSpoilers";

import Dropdown from "../components/dropdown";
import Layout from "../components/layout";

const rowsPerPage = 20;

const searchFiltersOptions = [
  { id: "all", name: "All" },
  { id: "characters", name: "Characters" },
  { id: "items", name: "Items" },
];

function SearchToolbar() {
  const router = useRouter();
  const query = router.query;

  function handleTypeChange(newType) {
    if (query.type === newType || newType === "all") {
      delete query.type;
    } else {
      query.type = newType;
    }
    router.push({
      pathname: "/search",
      query: query,
    });
  }

  return (
    <div className="toolbar">
      <div className="toolbar-inner">
        <Dropdown
          onChange={handleTypeChange}
          options={searchFiltersOptions}
          value={optionToLabel(query.type, searchFiltersOptions)}
        />
      </div>
    </div>
  );
}

function Search({ searchResults }) {
  const { spoilers } = useSpoilers();
  const [cards, setCards] = useState(searchResults.slice(0, rowsPerPage));

  function loadMore(page) {
    setCards(searchResults.slice(0, (page + 1) * rowsPerPage));
  }

  function filterSpoilers(card) {
    if (card.class) {
      return (
        baseCharacters.includes(card.class) ||
        spoilers.characters?.has(card.class)
      );
    } else {
      if (card.source === "Prosperity")
        return card.prosperity <= parseInt(spoilers.items.prosperity, 10);
      if (card.source === "Random Item Design") return spoilers.items.recipes;
      if (card.source === "Other") return spoilers.items.other;
    }

    return false;
  }

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", colour(null));
  }, []);

  useEffect(() => {
    setCards(searchResults.slice(0, rowsPerPage));
  }, [searchResults]);

  return (
    <Layout>
      <SearchToolbar />
      {searchResults && (
        <InfiniteScroll
          className="card-list"
          hasMore={cards.length < searchResults.length}
          loader={<h4 key={0}>Loading...</h4>}
          loadMore={loadMore}
          pageStart={0}
        >
          {cards.filter(filterSpoilers).map((card, idx) => (
            <div key={idx} className="card">
              <img alt="" className="card-img" src={baseUrl + card.image} />
            </div>
          ))}
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="card" />
          ))}
        </InfiniteScroll>
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { searchResults } = await search(context.query);

  return {
    props: {
      searchResults: searchResults,
    },
  };
}

export default Search;
