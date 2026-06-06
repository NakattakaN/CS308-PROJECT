import sys
with open('src/ProductPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '      <div className="filter-bar" ref={filterBarRef}>'
end_marker = '      <div className="product-page-container">'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print('Failed to find markers')
    sys.exit(1)

filter_bar_code = content[start_idx:end_idx]
new_content = content[:start_idx] + content[end_idx:]

insert_marker = '        </div>\n\n        {filteredProducts.length > 0 ? ('
insert_idx = new_content.find(insert_marker)

if insert_idx == -1:
    print('Failed to find insert marker')
    sys.exit(1)

new_content = new_content[:insert_idx] + '        </div>\n\n' + filter_bar_code + '        {filteredProducts.length > 0 ? ('

with open('src/ProductPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Done!')
